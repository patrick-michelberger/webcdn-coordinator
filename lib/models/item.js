module.exports = Item;

function Item(hash, size, contentHash) {
	this.hash = hash;
	this.size = size;
	this.contentHash = contentHash;
};