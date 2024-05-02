function generateRandomCode(): string {
    const min = 1000; // Minimum 4-digit number
    const max = 9999; // Maximum 4-digit number
    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomCode.toString();
}

export default generateRandomCode;