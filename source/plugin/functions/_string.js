function replaceAll(text, value, replacement) {
    if (text && text !== null)
        return text.split(value).join(replacement);

    return null;
};

module.exports = { replaceAll };