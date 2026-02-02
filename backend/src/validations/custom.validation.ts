import Joi from "joi";

const objectId = (value: string, helpers: Joi.CustomHelpers): string => {
  if (value.match(/^[0-9a-fA-F]{24}$/) == null) {
    // Throw an error if the validation fails
    throw new Joi.ValidationError(
      `"${value}" must be a valid mongo id`,
      [
        {
          message: `"${value}" must be a valid mongo id`,
          path: [],
          type: "string.mongoId",
          context: { label: value, value },
        },
      ],
      value,
    );
  }
  return value; // Return the value if validation passes
};

const toLowerCase = (value: string): string => {
  return value.toLowerCase(); // Return the lowercase
};

const password = (value: string, helpers: Joi.CustomHelpers): string => {
  const errors: string[] = [];
  const lengthValid = value.length >= 8 && value.length <= 32;
  const containsDigit = /\d/.test(value);
  const containsLowercase = /[a-z]/.test(value);
  const containsUppercase = /[A-Z]/.test(value);
  const containsSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

  if (!lengthValid) {
    errors.push("Password must be between 8 and 32 characters");
  }
  if (!containsDigit) {
    errors.push("Password must contain at least 1 digit");
  }
  if (!containsLowercase) {
    errors.push("Password must contain at least 1 lowercase letter");
  }
  if (!containsUppercase) {
    errors.push("Password must contain at least 1 uppercase letter");
  }
  if (!containsSpecialChar) {
    errors.push("Password must contain at least 1 special character");
  }

  if (errors.length > 0) {
    throw new Joi.ValidationError(
      errors.join("; "),
      errors.map((error) => ({
        message: error,
        path: ["password"],
        type: "string.passwordComplexity",
        context: { label: "password", value },
      })),
      value,
    );
  }

  return value; // Return the value if validation passes
};

export { objectId, password, toLowerCase };
