import Joi, { type ObjectSchema } from "joi";

interface GenerateS3PresignedViewURLBody {
  object_keys: string[];
}

interface GenerateS3PresignedUploadURLBody {
  object_key: string;
  mime_type: string;
}

interface GeneralValidation {
  generateS3PresignedViewURL: {
    body: ObjectSchema<GenerateS3PresignedViewURLBody>;
  };
  generateS3PresignedUploadURL: {
    body: ObjectSchema<GenerateS3PresignedUploadURLBody>;
  };
}

const generateS3PresignedViewURL: GeneralValidation["generateS3PresignedViewURL"] =
  {
    body: Joi.object<GenerateS3PresignedViewURLBody>().keys({
      object_keys: Joi.array().items(Joi.string().required()).required().min(1),
    }),
  };

const generateS3PresignedUploadURL: GeneralValidation["generateS3PresignedUploadURL"] =
  {
    body: Joi.object<GenerateS3PresignedUploadURLBody>()
      .keys({
        object_key: Joi.string().trim().required().label("Object Key"),
        mime_type: Joi.string().trim().required().label("Mime type"),
      })
      .min(1),
  };

export { generateS3PresignedUploadURL, generateS3PresignedViewURL };
