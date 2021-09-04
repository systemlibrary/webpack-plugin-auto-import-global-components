function replaceAll(text, search, replacement) {
    return text.split(search).join(replacement);
};

module.exports = { replaceAll };