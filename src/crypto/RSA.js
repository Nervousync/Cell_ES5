/*
 * Licensed to the Nervousync Studio (NSYC) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * 1.0.0
 * [New] RSA Utils Only Support RSA/ECB/NoPadding
 */
var RSAKey = Class.create();
RSAKey.prototype = {
    constructor : function(_exponent, _modulus, _radix) {
        _radix = _radix ? _radix : 16;
        if (_radix === 16) {
            this._exponentObj = BigInteger.parseHex(_exponent);
            this._modulusObj = BigInteger.parseHex(_modulus);
        } else if (_radix === 10) {
            this._exponentObj = BigInteger.parseDecimal(_exponent);
            this._modulusObj = BigInteger.parseDecimal(_modulus);
        } else {
            this._exponentObj = BigInteger.parseString(_exponent, _radix);
            this._modulusObj = BigInteger.parseString(_modulus, _radix);
        }
        this.radix = _radix;
        this.chunkSize = 2 * this._modulusObj.highIndex();

        this._highIndex = this._modulusObj.highIndex() + 1;
        this._b2k = new BigInteger();
        this._b2k._digits[2 * this._highIndex] = 1;
        this._mu = BigInteger.divide(this._b2k, this._modulusObj);
        this._bkPlus = new BigInteger();
        this._bkPlus._digits[this._highIndex + 1] = 1;
    },

    powMod : function(_block) {
        var _result = new BigInteger();
        _result._digits[0] = 1;

        var _tempValue = _block;
        var _temp = this._exponentObj;
        while (true) {
            if ((_temp._digits[0] & 1) !== 0) {
                _result = this._multiplyMod(_result, _tempValue);
            }
            _temp = _temp.shiftRight(1);
            if (_temp._digits[0] === 0 && _temp.highIndex() === 0) {
                break;
            }
            _tempValue = this._multiplyMod(_tempValue, _tempValue);
        }

        return _result;
    },

    _multiplyMod : function(x, y) {
        return this._modulo(BigInteger.multiply(x, y));
    },

    _modulo : function(x) {
        var _q1 = x.divideByRadixPower(this._highIndex - 1);
        var _q2 = BigInteger.multiply(_q1, this._mu);
        var _q3 = _q2.divideByRadixPower(this._highIndex + 1);
        var _r1 = x.moduloByRadixPower(this._highIndex + 1);
        var _r2term = BigInteger.multiply(_q3, this._modulusObj);
        var _r2 = _r2term.moduloByRadixPower(this._highIndex + 1);
        var _result = BigInteger.subtract(_r1, _r2);

        if (_result._isNeg) {
            _result = BigInteger.add(_result, this._bkPlus);
        }

        var _rgterm = BigInteger.compare(_result, this._modulusObj) >= 0;
        while (_rgterm) {
            _result = BigInteger.subtract(_result, this._modulusObj);
            _rgterm = BigInteger.compare(_result, this._modulusObj) >= 0;
        }

        return _result;
    }
};

var RSA = Class.create();
RSA.prototype = {
    constructor : function(_exponent, _modulus, _radix, _keySize) {
        _radix = _radix ? _radix : 16;
        _keySize = _keySize ? _keySize : 1024;
        switch(_keySize) {
            case 128:
                BigInteger.init(19);
                break;
            case 256:
                BigInteger.init(38);
                break;
            case 512:
                BigInteger.init(76);
                break;
            case 1024:
                BigInteger.init(130);
                break;
            case 2048:
                BigInteger.init(260);
                break;
            default:
                BigInteger.init(19);
                break;

        }
        this._key = new RSAKey(_exponent, _modulus, _radix);
    },

    encrypt : function(msgContent) {
        var _array = [];
        var _length = msgContent.length > this._key.chunkSize ? this._key.chunkSize : msgContent.length;
        var _index = 0;

        var _j = this._key.chunkSize - 1;

        while (_index < _length) {
            _array[_j] = msgContent.charCodeAt(_index);
            _index++;
            _j--;
        }

        _index = 0;
        _j = this._key.chunkSize - (_length % this._key.chunkSize);
        while(_j > 0) {
            _array[_index] = 0;
            _index++;
            _j--;
        }

        var _result = "";
        var _block = null;

        for (_index = 0 ; _index < _array.length ; _index += this._key.chunkSize) {
            _block = new BigInteger();
            _j = 0;
            for (var _k = _index ; _k < _index + this._key.chunkSize ; ++_j) {
                _block._digits[_j] = _array[_k++];
                _block._digits[_j] += (_array[_k++] << 8);
            }

            var _crypt = this._key.powMod(_block);
            _result += ((this._key.radix === 16 ? _crypt.toHex() : _crypt.toStr(this._key.radix)) + " ");
        }

        return _result.substring(0, _result.length - 1);
    },

    decrypt : function(msgContent) {
        var _blocks = msgContent.split(" ");
        var _result = "";

        for (var i = 0 ; i < _blocks.length ; ++i) {
            var _BigInteger = (this._key.radix === 16) ? BigInteger.parseHex(_blocks[i]) : BigInteger.parseString(_blocks[i], this._key.radix);

            var _block = this._key.powMod(_BigInteger);

            for (var j = 0 ; j <= _block.highIndex() ; ++j) {
                _result += String.fromCharCode(_block._digits[j] & 255, _block._digits[j] >> 8);
            }
        }

        if (_result.charCodeAt(_result.length - 1) === 0) {
            _result = _result.substring(0, _result.length - 1);
        }

        return _result.reverse();
    }
};

(function () {
    if (typeof Cell !== "undefined") {
        Cell.registerComponent("RSA", RSA);
    } else {
        window.RSA = RSA;
    }
})();

var HIGH_BIT_MASKS = [0x0000, 0x8000, 0xC000, 0xE000, 0xF000, 0xF800, 0xFC00,
    0xFE00, 0xFF00, 0xFF80, 0xFFC0, 0xFFE0, 0xFFF0, 0xFFF8, 0xFFFC, 0xFFFE, 0xFFFF];

var LOW_BIT_MASKS = [0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F, 0x003F,
    0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF];

var BASE36 = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
    'i', 'j','k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

function charToHex(c) {
    if (c >= 48 && c <= 57) {
        return c - 48;
    } else if (c >= 65 && c <= 90) {
        return 10 + c - 65;
    } else if (c >= 97 && c <= 122) {
        return 10 + c - 97;
    } else {
        return 0;
    }
}

function hexToDigit(s) {
    var _result = 0;
    var _length = Math.min(s.length, 4);
    for (var i = 0 ; i < _length ; ++i) {
        _result <<= 4;
        _result |= charToHex(s.charCodeAt(i));
    }
    return _result;
}

function digitToHex(n) {
    var _result = "";
    for (var i = 0 ; i < 4 ; ++i) {
        _result += BASE16[n & 0xf];
        n >>>= 4;
    }
    return _result.reverse();
}

var BigInteger = Class.create();

BigInteger.RadixBits = 16;
BigInteger.BitsPerDigit = BigInteger.RadixBits;
BigInteger.Radix = 1 << 16;
BigInteger.HalfRadix = BigInteger.Radix >>> 1;
BigInteger.RadixSquared = BigInteger.Radix * BigInteger.Radix;
BigInteger.MaxDigitVal = BigInteger.Radix - 1;
BigInteger.ZERO = new BigInteger();
BigInteger.ZERO_ARRAY = [];

BigInteger.DPL10 = 15;
BigInteger.LR10 = BigInteger.parseNumber(1000000000000000);

BigInteger.init = function(maxDigits) {
    if (BigInteger.ZERO_ARRAY.length !== maxDigits) {
        BigInteger.ZERO_ARRAY = new Array(maxDigits);
        for (var i = 0 ; i < maxDigits ; i++) {
            BigInteger.ZERO_ARRAY[i] = 0;
        }
        BigInteger.ONE = new BigInteger();
        BigInteger.ONE._digits[0] = 1;
    }
};

BigInteger.prototype = {
    constructor : function(flag) {
        if (BigInteger.ZERO_ARRAY.length === 0) {
            BigInteger.init(20);
        }
        flag = flag ? flag : false;
        if (typeof flag === "boolean" && flag === true) {
            this._digits = null;
        } else {
            this._digits = BigInteger.ZERO_ARRAY.slice(0);
        }
        this._isNeg = false;
    },

    clone : function() {
        var result = new BigInteger(true);
        result._digits = this._digits.slice(0);
        result._isNeg = this._isNeg;
        return result;
    },

    highIndex : function() {
        var _result = this._digits.length - 1;
        while (_result > 0 && this._digits[_result] === 0) {
            --_result;
        }
        return _result;
    },

    numBits : function() {
        var _n = this.highIndex();
        var _digit = this._digits[_n];
        var _m = (_n + 1) * BigInteger.BitsPerDigit;
        var _result;
        for (_result = _m ; _result > _m - BigInteger.BitsPerDigit ; --_result) {
            if ((_digit & 0x8000) !== 0) {
                break;
            }
            _digit <<= 1;
        }
        return _result;
    },

    shiftLeft : function(n) {
        var _digitCount = Math.floor(n / BigInteger.BitsPerDigit);
        var _result = new BigInteger();
        BigInteger.arrayCopy(this._digits, 0, _result._digits, _digitCount, _result._digits.length - _digitCount);
        var _bits = n % BigInteger.BitsPerDigit;
        var _rightBits = BigInteger.BitsPerDigit - _bits;

        for (var i = _result._digits.length - 1 , j = i - 1 ; i > 0 ; --i, --j) {
            _result._digits[i] = ((_result._digits[i] << _bits) & BigInteger.MaxDigitVal) |
                ((_result._digits[j] & HIGH_BIT_MASKS[_bits]) >>> (_rightBits));
        }

        _result._digits[0] = ((_result._digits[0] << _bits) & BigInteger.MaxDigitVal);
        _result._isNeg = this._isNeg;

        return _result;
    },

    shiftRight : function(n) {
        var _digitCount = Math.floor(n / BigInteger.BitsPerDigit);
        var _result = new BigInteger();
        BigInteger.arrayCopy(this._digits, _digitCount, _result._digits, 0, this._digits.length - _digitCount);
        var _bits = n % BigInteger.BitsPerDigit;
        var _leftBits = BigInteger.BitsPerDigit - _bits;

        for (var i = 0 , j = i + 1 ; i < _result._digits.length - 1 ; ++i, ++j) {
            _result._digits[i] = (_result._digits[i] >>> _bits) | ((_result._digits[j] & LOW_BIT_MASKS[_bits]) << _leftBits);
        }

        _result._digits[_result._digits.length - 1] >>>= _bits;
        _result._isNeg = this._isNeg;

        return _result;
    },

    divideByRadixPower : function(n) {
        var _result = new BigInteger();
        BigInteger.arrayCopy(this._digits, n, _result._digits, 0, _result._digits.length - n);
        return _result;
    },

    moduloByRadixPower : function(n) {
        var _result = new BigInteger();
        BigInteger.arrayCopy(this._digits, 0, _result._digits, 0, n);
        return _result;
    },

    multiplyByRadixPower : function(n) {
        var _result = new BigInteger();
        BigInteger.arrayCopy(this._digits, 0, _result._digits, n, _result._digits.length - n);
        return _result;
    },

    toDecimal : function() {
        var _tmp = new BigInteger();
        _tmp._digits[0] = 10;
        var _qr = BigInteger.divideModulo(this, _tmp);
        var _result = String(_qr[1]._digits[0]);
        while (BigInteger.compare(_qr[0], BigInteger.ZERO) === 1) {
            _result += String(BigInteger.modulo(_qr[0], _tmp)._digits[0]);
        }
        return (this._isNeg ? "-" : "") + _result.reverse();
    },

    toHex : function() {
        var _result = "";
        for (var i = this.highIndex() ; i > -1 ; --i) {
            _result += digitToHex(this._digits[i]);
        }
        return _result;
    },

    toStr : function(radix) {
        var _tmp = new BigInteger();
        _tmp._digits[0] = radix;
        var _qr = BigInteger.divideModulo(this, _tmp);
        var _result = BASE36[_qr[1]._digits[0]];
        while (BigInteger.compare(_qr[0], BigInteger.ZERO) === 1) {
            _qr = BigInteger.divideModulo(_qr[0], _tmp);
            _result += BASE36[_qr[1]._digits[0]];
        }

        return (this._isNeg ? "-" : "") + _result.reverse();
    }
};

BigInteger.parseNumber = function(number) {
    var _result = new BigInteger();
    _result._isNeg = number < 0;
    number = Math.abs(number);
    var _j = 0;
    while (number > 0) {
        _result._digits[_j++] = number & BigInteger.MaxDigitVal;
        number >>= BigInteger.RadixBits;
    }
    return _result;
};

BigInteger.arrayCopy = function(source, sourceBegin, dest, destBegin, length) {
    var _maxLength = Math.min(sourceBegin + length, source.length);
    for (var i = sourceBegin , j = destBegin ; i < _maxLength ; ++i, ++j) {
        dest[j] = source[i];
    }
};

BigInteger.compare = function(x, y) {
    if (x._isNeg !== y._isNeg) {
        return 1 - 2 * Number(x._isNeg);
    }

    for (var i = x._digits.length - 1 ; i >= 0 ; --i) {
        if (x._digits[i] !== y._digits[i]) {
            if (x._isNeg) {
                return 1 - 2 * Number(x._digits[i] > y._digits[i]);
            } else {
                return 1 - 2 * Number(x._digits[i] < y._digits[i]);
            }
        }
    }
    return 0;
};

BigInteger.multiply = function(x, y) {
    var _result = new BigInteger();

    var _hIndex_X = x.highIndex();		// n
    var _hIndex_Y = y.highIndex();		// t

    for (var i = 0 ; i <= _hIndex_Y ; ++i) {
        var _temp = 0;
        var k = i;
        for (var j = 0 ; j <= _hIndex_X ; ++j, ++k) {
            var _uv = _result._digits[k] + x._digits[j] * y._digits[i] + _temp;
            _result._digits[k] = _uv & BigInteger.MaxDigitVal;
            _temp = _uv >>> BigInteger.RadixBits;
        }

        _result._digits[i + _hIndex_X + 1] = _temp;
    }

    _result._isNeg = x._isNeg !== y._isNeg;
    return _result;
};

BigInteger.multiplyDigit = function(x, y) {
    var _result = new BigInteger();
    var _temp = 0;
    var _n = x.highIndex();

    for (var i = 0 ; i <= _n ; ++i) {
        var _uv = _result._digits[i] + x._digits[i] * y + _temp;
        _result._digits[i] = _uv & BigInteger.MaxDigitVal;
        _temp = _uv >>> BigInteger.RadixBits;
    }

    _result._digits[1 + _n] = _temp;
    return _result;
};

BigInteger.add = function(x, y) {
    var _result;
    if (x._isNeg !== y._isNeg) {
        y._isNeg = !y._isNeg;
        _result = BigInteger.subtract(x, y);
        y._isNeg = !y._isNeg;
    } else {
        _result = new BigInteger();
        var _temp = 0;
        var _n = null;

        for (var i = 0 ; i < x._digits.length ; ++i) {
            _n = x._digits[i] + y._digits[i] + _temp;
            _result._digits[i] = _n & 0xffff;
            _temp = Number(_n > BigInteger.Radix);
        }

        _result._isNeg = x._isNeg;
    }
    return _result;
};

BigInteger.subtract = function(x, y) {
    var _result;
    if (x._isNeg !== y._isNeg) {
        y._isNeg = !y._isNeg;
        _result = BigInteger.add(x, y);
        y._isNeg = !y._isNeg;
    } else {
        _result = new BigInteger();
        var _temp = 0;
        var _n = null;

        var index;

        for (index = 0 ; index < x._digits.length ; ++index) {
            _n = x._digits[index] - y._digits[index] + _temp;
            _result._digits[index] = _n & 0xffff;

            if (_result._digits[index] < 0) {
                _result._digits[index] += BigInteger.Radix;
            }

            _temp = 0 - Number(_n < 0);
        }

        if (_temp === -1) {
            _temp = 0;
            for (index = 0 ; index < x._digits.length ; ++index) {
                _n = 0 - _result._digits[index] + _temp;
                _result._digits[index] = _n & 0xffff;

                if (_result._digits[index] < 0) {
                    _result._digits[index] += BigInteger.Radix;
                }
                _temp = 0 - Number(_n < 0);
            }

            _result._isNeg = !x._isNeg;
        } else {
            _result._isNeg = x._isNeg;
        }
    }

    return _result;
};

BigInteger.divideModulo = function(x, y) {
    var _numBits_X = x.numBits();		// nb
    var _numBits_Y = y.numBits();		// tb

    var _orig_Y_isNeg = y._isNeg;

    var _q, _r;

    if (_numBits_X < _numBits_Y) {
        if (x._isNeg) {
            _q = BigInteger.ONE.clone();
            _q._isNeg = !y._isNeg;
            x._isNeg = false;
            y._isNeg = false;
            _r = BigInteger.subtract(y, x);
            x._isNeg = true;
            y._isNeg = _orig_Y_isNeg;
        } else {
            _q = new BigInteger();
            _r = x.clone();
        }
    } else {
        _q = new BigInteger();
        _r = x;

        var _t = Math.ceil(_numBits_Y / BigInteger.BitsPerDigit) - 1;
        var _lambda = 0;

        while (y._digits[_t] < BigInteger.HalfRadix) {
            y = y.shiftLeft(1);
            ++_lambda;
            ++_numBits_Y;
            _t = Math.ceil(_numBits_Y / BigInteger.BitsPerDigit) - 1;
        }

        _r = _r.shiftLeft(_lambda);
        _numBits_X += _lambda;

        var _n = Math.ceil(_numBits_X / BigInteger.BitsPerDigit) - 1;

        var _b = y.multiplyByRadixPower(_n - _t);

        while (BigInteger.compare(_r, _b) !== -1) {
            ++_q._digits[_n - _t];
            _r = BigInteger.subtract(_r, _b);
        }

        for (var i = _n ; i > _t ; --i) {
            var _ri = (i >= _r._digits.length) ? 0 : _r._digits[i];
            var _ri1 = (i - 1 >= _r._digits.length) ? 0 : _r._digits[i - 1];
            var _ri2 = (i - 2 >= _r._digits.length) ? 0 : _r._digits[i - 2];
            var _yt = (_t >= y._digits.length) ? 0 : y._digits[_t];
            var _yt1 = (_t - 1 >= y._digits.length) ? 0 : y._digits[_t - 1];

            _q._digits[i - _t - 1] = (_ri === _yt) ? BigInteger.MaxDigitVal : Math.floor((_ri * BigInteger.Radix + _ri1) / _yt);

            var _c1 = _q._digits[i - _t - 1] * ((_yt * BigInteger.Radix) + _yt1);
            var _c2 = (_ri * BigInteger.RadixSquared) + ((_ri1 * BigInteger.Radix) + _ri2);

            while (_c1 > _c2) {
                --_q._digits[i - _t - 1];
                _c1 = _q._digits[i - _t - 1] * ((_yt * BigInteger.Radix) + _yt1);
                _c2 = (_ri * BigInteger.RadixSquared) + ((_ri1 * BigInteger.Radix) + _ri2);
            }

            _b = y.multiplyByRadixPower(i - _t - 1);
            _r = BigInteger.subtract(_r, BigInteger.multiplyDigit(_b, _q._digits[i - _t - 1]));
            if (_r._isNeg) {
                _r = BigInteger.add(_r, _b);
                --_q._digits[i - _t - 1];
            }
        }

        _r = _r.shiftRight(_lambda);

        _q._isNeg = x._isNeg !== _orig_Y_isNeg;

        if (x._isNeg) {
            if (_orig_Y_isNeg) {
                _q = BigInteger.add(_q, BigInteger.ONE);
            } else {
                _q = BigInteger.subtract(_q, BigInteger.ONE);
            }

            _r = BigInteger.subtract(y.shiftRight(_lambda), _r);
        }

        if (_r._digits[0] === 0 && _r.highIndex() === 0) {
            _r._isNeg = false;
        }
    }

    return [_q, _r];
};

BigInteger.divide = function(x, y) {
    return BigInteger.divideModulo(x, y)[0];
};

BigInteger.modulo = function(x, y) {
    return BigInteger.divideModulo(x, y)[1];
};

BigInteger.parseDecimal = function(s) {
    var _isNeg = s.charAt(0) === '-';
    var _index = _isNeg ? 1 : 0;
    var _result;

    while (_index < s.length && s.charAt(_index) === '0') {
        ++_index;
    }

    if (_index === s.length) {
        _result = new BigInteger();
    } else {
        var _digitCount = s.length - _index;
        var _fgl = _digitCount % BigInteger.DPL10;
        if (_fgl === 0) {
            _fgl = BigInteger.DPL10;
        }

        _result = BigInteger.parseNumber(Number(s.substr(_index, _fgl)));
        _index += _fgl;

        while (_index < s.length) {
            _result = BigInteger.add(BigInteger.multiply(_result, BigInteger.LR10),
                BigInteger.parseNumber(Number(s.substr(_index, BigInteger.DPL10))));
            _index += BigInteger.DPL10;
        }

        _result._isNeg = _isNeg;
    }

    return _result;
};

BigInteger.parseHex = function(hex) {
    var _result = new BigInteger();
    var _length = hex.length;
    for (var i = _length , j = 0 ; i > 0 ; i -= 4 , ++j) {
        _result._digits[j] = hexToDigit(hex.substr(Math.max(i - 4, 0), Math.min(i, 4)));
    }
    return _result;
};

BigInteger.parseString = function(s, radix) {
    var _isNeg = s.charAt(0) === '-';
    var _isTop = _isNeg ? 1 : 0;
    var _result = new BigInteger();
    var _place = new BigInteger();
    _place._digits[0] = 1;
    for (var i = s.length - 1 ; i >= _isTop ; i--) {
        var _c = s.charCodeAt(i);
        var _digit = charToHex(_c);
        var _BigIntegerDigit = BigInteger.multiplyDigit(_place, _digit);
        _result = BigInteger.add(_result, _BigIntegerDigit);
        _place = BigInteger.multiplyDigit(_place, radix);
    }
    _result._isNeg = _isNeg;
    return _result;
};