var gm = require('gm').subClass({imageMagick: true});

module.exports = Image = function(){}

Image.prototype.setData = function(data, options){
  return new Promise((resolve, reject) => {
    _setData(this, data, resolve, reject, options);
  });
}

Image.prototype.width = function(){
	return this._size.width;
}

Image.prototype.height = function(){
	return this._size.height;
}

Image.prototype.data = function(){
	return Promise.resolve(this._data);
}

Image.prototype.crop = function(options){
	var self = this;
	var w = options.width;
	var h = options.height;
	var l = options.left || 0;
  var t = options.top || 0;

  	var r = options.right || 0;
  	var b = options.bottom || 0;
    if (!options.width) {
    	w = self.width()-r-l;
    }
    if (!options.height) {
    	h = self.height()-b-t;
    }
  var cropped = self._image.crop(w,h,l,t);
	return _wrap(self, cropped, options);
}

Image.prototype.scale = function(options){
	var self = this;
	if(options.ratio){
		options.width = options.ratio*self.width();
		options.height = options.ratio*self.height();
	}
	return _wrap(self, self._image.scale(options.width, options.height),options);
}

Image.prototype.resize = function(options){
  var self = this;
  if (options.ignoreAspectRatio) {
    return _wrap(self, self._image.resizeExact(options.width, options.height),options);
  } else {
    return _wrap(self, self._image.resize(options.width, options.height),options);
  }
}

Image.prototype.setFormat = function(format,options){
	var self = this;
	self._image.setFormat(format.toLowerCase());
	return _wrap(self, self._image, options);
}

Image.prototype.format = function(options){
  return new Promise((resolve, reject) => {
    this._image.format(callbackify(resolve, reject, options));
  });
}

Image.prototype.pad = function(options) {
	var self = this;
	var w = options.width;
	var h = options.height;
	var l = options.left || 0;
  	var t = options.top || 0;

  	var r = options.right || 0;
  	var b = options.bottom || 0;

    if (!options.width) {
    	w = self.width()+r+l;
    }
    if (!options.height) {
    	h = self.height()+b+t;
    }

    var padded = self._image.out("-background", options.color)
    	.borderColor(options.color)
    	.border(l, r)
    	.extent(w, h)
    	.out("-flatten")

    return _wrap(self, padded, options);
}


var _setData = function(self, data, resolve, reject, options) {
	self._data = data;
	self._image = gm(data);
  self._image.size({bufferStream: true}, function(err, size){
  	self._size = size;
    callbackify(resolve, reject, options)(err, self);
  });
}

var _callback = function(self, resolve, reject, options){
  options = options || {};

	return function(err, buf){
		if (err) {
			options.error && options.error(err);
		  reject(err);
		} else{
			_setData(self, buf, resolve, reject, options);
		}
	}
}

var _wrap = function(self, gm, options){
  return new Promise((resolve, reject) => {
    gm.toBuffer(_callback(self, resolve, reject, options));
  });
}

var callbackify = function(resolve, reject, options) {
  options = options || {};
  return function(err, res) {
    if (err) {
      options.error && options.error(err);
      return reject(err);
    } else {
      options.success && options.success(err);
      return resolve(res);
    }
  };
}

