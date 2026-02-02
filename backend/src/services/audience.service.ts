import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";
import config from "../config/config";

const rekognitionClient = new RekognitionClient({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

/**
 * Detect audience demographics from an image buffer
 * @param {Buffer} imageBuffer
 * @returns {Promise<any>}
 */
const detectDemographics = async (imageBuffer: Buffer) => {
    const command = new DetectFacesCommand({
        Image: {
            Bytes: imageBuffer as any,
        },
        Attributes: ["ALL"],
    });

    try {
        const response = await rekognitionClient.send(command);
        if (!response.FaceDetails || response.FaceDetails.length === 0) {
            return null;
        }

        // Get the most prominent face
        const primaryFace = response.FaceDetails[0];

        return {
            ageRange: `${primaryFace.AgeRange?.Low}-${primaryFace.AgeRange?.High}`,
            gender: primaryFace.Gender?.Value,
            confidence: primaryFace.Confidence,
        };
    } catch (error) {
        console.error("AWS Rekognition error:", error);
        return null;
    }
};

export default {
    detectDemographics,
};
