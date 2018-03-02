import * as functions from 'firebase-functions';

// Firebase
import * as admin from 'firebase-admin';
admin.initializeApp(functions.config().firebase);


// Cloud Vision
import * as vision from '@google-cloud/vision';
const visionClient =  new vision.ImageAnnotatorClient();

// Dedicated bucket for cloud function invocation
const bucketName = 'visionapp-3fd88';

export const imageTagger = functions.storage

    .bucket(bucketName)
    .object()
    .onChange( async event => {

            // File data
            const object = event.data;
            const filePath = object.name;

            // Location of saved file in bucket
            const imageUri = `gs://${bucketName}/${filePath}`;

            // Firestore docID === file name
            const docId = filePath.split('.jpg')[0];

            const docRef  = admin.firestore().collection('photos').doc(docId);

            // Await the cloud vision response for labels
            const results = await visionClient.labelDetection(imageUri);

            // Await the cloud vision response for text and pass in English and Chinese hints
            // as an imageContext object

            const detectText = await visionClient.textDetection({
              image: {
                source: { imageUri }
              },
              imageContext: {
                languageHints: ['en', 'zh']
              },
          });

            // Map the lables data to desired format
            const labels = results[0].labelAnnotations.map(obj => obj.description);

            // Map the text data to desired format
            const imageText = detectText[0].textAnnotations.map(obj => obj.description);

            //const hotdog = labels.includes('hot dog')
            const registrationPlate = labels.includes('vehicle registration plate');

            //return docRef.set({ hotdog, labels })
            return docRef.set({ registrationPlate, labels, imageText })


});
