// Function to generate a compliant password
export const generateRandomPassword = (length: number = 12): string => {
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialCharacters = "!@#$%^&*()_+[]{}|;:,.<>?";

  const allCharacters =
    uppercaseLetters + lowercaseLetters + numbers + specialCharacters;

  let password = "";
  let hasLetter = false;
  let hasNumber = false;

  while (!hasLetter || !hasNumber || password.length < length) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    const randomChar = allCharacters[randomIndex];
    password += randomChar;

    if (/[a-zA-Z]/.test(randomChar)) hasLetter = true;
    if (/\d/.test(randomChar)) hasNumber = true;
  }

  return password.slice(0, length);
};

export const generatePassword = (length: number = 8): string => {
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specialCharacters = "!@#$%^&*()_+[]{}|;:,.<>?";

  // Ensure at least one character from each category
  let password = "";
  password +=
    uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
  password +=
    lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password +=
    specialCharacters[Math.floor(Math.random() * specialCharacters.length)];

  // Fill the remaining length of the password with random characters
  const allCharacters =
    uppercaseLetters + lowercaseLetters + digits + specialCharacters;
  for (let i = 4; i < length; i++) {
    password += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }

  // Shuffle the password to ensure randomness
  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  return password;
};
