"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
// Firebase
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// Cloud Vision
const vision = require("@google-cloud/vision");
const visionClient = new vision.ImageAnnotatorClient();
// Dedicated bucket for cloud function invocation
const bucketName = 'visionapp-3fd88';
exports.imageTagger = functions.storage
    .bucket(bucketName)
    .object()
    .onChange((event) => __awaiter(this, void 0, void 0, function* () {
    // File data
    const object = event.data;
    const filePath = object.name;
    // Location of saved file in bucket
    const imageUri = `gs://${bucketName}/${filePath}`;
    // Firestore docID === file name
    const docId = filePath.split('.jpg')[0];
    const docRef = admin.firestore().collection('photos').doc(docId);
    // Await the cloud vision response for labels
    const results = yield visionClient.labelDetection(imageUri);
    // Await the cloud vision response for text and pass in English and Chinese hints
    // as an imageContext object
    const detectText = yield visionClient.textDetection({
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
    return docRef.set({ registrationPlate, labels, imageText });
}));
//# sourceMappingURL=index.js.map