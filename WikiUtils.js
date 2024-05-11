export function cleanText(inputText) {
    const regex = /\[.*?\]|\(.*?\)/g;
    const cleanedText = inputText.replace(regex, '');

    return cleanedText;
}