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
 * [New] Define Standard CRC Algorithms
 * [New] CRC Support From CRC3 to CRC32
 */
var CRC_CONSTANT = {};

var CRC = Class.create();

CRC.prototype = {
    constructor : function(name) {
        if (CRC_CONSTANT.hasOwnProperty(name)) {
            var _config = CRC_CONSTANT[name];
            this._bit = _config[0];
            this._refIn = _config[4];
            this._refOut = _config[5];
            this._polynomial = this._refIn ? CRC._REVERSE_BIT(_config[1], this._bit) : (this._bit < 8 ? (_config[1] << (8 - this._bit)) : _config[1]);
            this._init = this._refIn ? CRC._REVERSE_BIT(_config[2], this._bit) : (this._bit < 8 ? (_config[2] << (8 - this._bit)) : _config[2]);
            this._crc = this._init;
            this._xorOut = _config[3];
            if (this._refIn) {
                this._check = 0x1;
            } else {
                if (this._bit <= 8) {
                    this._check = 0x80;
                } else {
                    this._check = Math.pow(2, this._bit - 1);
                }
            }
            this._outLength = Math.floor(this._bit / 4);
            if (this._bit % 4 !== 0) {
                this._outLength++;
            }
            var _string = "";
            for (var i = 0 ; i < this._bit ; i++) {
                _string += "1";
            }
            this._mask = parseInt(_string, 2);
        } else {
            throw new Error(Cell.message("CRC", "CRC.ALGORITHMS", name));
        }
    },

    append : function(string) {
        if (string == null) {
            string = "";
        }
        this.appendBinary(string.toByteArray());
    },

    appendBinary : function(dataBytes) {
        var _length = dataBytes.length, i, j;
        for (i = 0 ; i < _length ; i++) {
            if (this._bit > 8) {
                this._crc ^= ((this._refIn ? dataBytes[i] : (dataBytes[i] << (this._bit - 8))) & this._mask);
            } else {
                this._crc ^= dataBytes[i];
            }
            for (j = 0 ; j < 8 ; j++) {
                if ((this._crc & this._check) !== 0) {
                    this._crc = (this._refIn ? (this._crc >>> 1) : (this._crc << 1)) ^ this._polynomial;
                } else {
                    this._crc = (this._refIn ? (this._crc >>> 1) : (this._crc << 1));
                }
            }
        }
        this._crc &= this._mask;
    },

    finish : function() {
        if (this._bit < 8 && !this._refIn) {
            this._crc >>= (8 - this._bit);
        }
        var _result;
        if (this._refIn !== this._refOut && this._refOut) {
            //  Just using for CRC-12/UMTS
            _result = this._crc & this._mask;
            _result = ((CRC._REVERSE_BIT(_result, _result.toString(2).length) ^ this._xorOut) >>> 0).toString(16);
        } else {
            _result = (((this._crc ^ this._xorOut) & this._mask) >>> 0).toString(16);
        }
        while (_result.length < this._outLength) {
            _result = "0" + _result;
        }
        this.reset();
        return "0x" + _result;
    },

    reset : function() {
        this._crc = this._init;
    }
};

CRC.REGISTER = function(name, bit, polynomial, init, xorOut, refIn, refOut, override) {
    if (init == null) {
        init = 0x00;
    }
    if (xorOut == null) {
        xorOut = 0x00;
    }
    if (refIn == null) {
        refIn = false;
    }
    if (refOut == null) {
        refOut = false;
    }
    if (override == null) {
        override = false;
    }
    if (CRC_CONSTANT.hasOwnProperty(name) && !override) {
        console.log(Cell.message("CRC", "CRC.Exists", name));
        return;
    }
    if (Cell.developmentMode()) {
        console.log(Cell.message("CRC", "CRC.Register", name, bit, polynomial, init, xorOut, refIn, refOut));
    }
    CRC_CONSTANT[name] = [bit, polynomial, init, xorOut, refIn, refOut];
};

/**
 * @return {string}
 */
CRC.REGISTERED_ALGORITHMS = function() {
    var _array = [];
    for (var name in CRC_CONSTANT) {
        _array.push(name);
    }
    return _array.join(", ");
};

CRC._REVERSE_BIT = function(value, bitWidth) {
    if (value == null) {
        value = 0x00;
    }
    var _result = 0;
    for (var i = 0 ; i < bitWidth ; i++) {
        if (value & 0x1) {
            _result |= 1 << (bitWidth - 1 - i);
        }
        value >>= 1;
    }
    return _result >>> 0;
};

(function() {
    Cell.registerResources("CRC", {
        "zh" : {
            "CRC.ALGORITHMS" : "无法找到CRC算法{0}对应的配置参数",
            "CRC.Register" : "注册CRC算法，名称：{0}，位数：{1}，多项式：{2}，初始值：{3}，结果异或值：{4}，输入反转：{5}，输出反转：{6}",
            "CRC.Exists" : "CRC算法{0}配置已存在",
            "CRC.SUPPORTED" : "已支持的CRC算法：{0}"
        },
        "en" : {
            "CRC.ALGORITHMS" : "Can't found config by given CRC algorithms name {0}",
            "CRC.Register" : "Register CRC algorithm，name：{0}，bit：{1}，polynomial：{2}，init：{3}，xorOut：{4}，refIn：{5}，refOut：{6}",
            "CRC.Exists" : "CRC algorithms name {0} was exists",
            "CRC.SUPPORTED" : "Supported CRC algorithms ：{0}"
        }
    });

    CRC.REGISTER("CRC-3/GSM", 3, 0x3, 0x0, 0x7, false, false);
    CRC.REGISTER("CRC-3/ROHC", 3, 0x3, 0x7, 0x0, true, true);
    CRC.REGISTER("CRC-4/G-704", 4, 0x3, 0x0, 0x0, true, true);
    CRC.REGISTER("CRC-4/INTERLAKEN", 4, 0x3, 0xF, 0xF, false, false);
    CRC.REGISTER("CRC-5/EPC-C1G2", 5, 0x09, 0x09, 0x00, false, false);
    CRC.REGISTER("CRC-5/G-704", 5, 0x15, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-5/USB", 5, 0x05, 0x1F, 0x1F, true, true);
    CRC.REGISTER("CRC-6/CDMA2000-A", 6, 0x27, 0x3F, 0x00, false, false);
    CRC.REGISTER("CRC-6/CDMA2000-B", 6, 0x07, 0x3F, 0x00, false, false);
    CRC.REGISTER("CRC-6/DARC", 6, 0x19, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-6/G-704", 6, 0x03, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-6/GSM", 6, 0x2F, 0x00, 0x3F, false, false);
    CRC.REGISTER("CRC-7/MMC", 7, 0x09, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-7/ROHC", 7, 0x4F, 0x7F, 0x00, true, true);
    CRC.REGISTER("CRC-7/UMTS", 7, 0x45, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/AUTOSAR", 8, 0x2F, 0xFF, 0xFF, false, false);
    CRC.REGISTER("CRC-8/BLUETOOTH", 8, 0xA7, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-8/CDMA2000", 8, 0x9B, 0xFF, 0x00, false, false);
    CRC.REGISTER("CRC-8/DARC", 8, 0x39, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-8/DVB-S2", 8, 0xD5, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/GSM-A", 8, 0x1D, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/GSM-B", 8, 0x49, 0x00, 0xFF, false, false);
    CRC.REGISTER("CRC-8/I-432-1", 8, 0x07, 0x00, 0x55, false, false);
    CRC.REGISTER("CRC-8/I-CODE", 8, 0x1D, 0xFD, 0x00, false, false);
    CRC.REGISTER("CRC-8/LTE", 8, 0x9B, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/MAXIM-DOW", 8, 0x31, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-8/MIFARE-MAD", 8, 0x1D, 0xC7, 0x00, false, false);
    CRC.REGISTER("CRC-8/NRSC-5", 8, 0x31, 0xFF, 0x00, false, false);
    CRC.REGISTER("CRC-8/OPENSAFETY", 8, 0x2F, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/ROHC", 8, 0x07, 0xFF, 0x00, true, true);
    CRC.REGISTER("CRC-8/SAE-J1850", 8, 0x1D, 0xFF, 0xFF, false, false);
    CRC.REGISTER("CRC-8/SMBUS", 8, 0x07, 0x00, 0x00, false, false);
    CRC.REGISTER("CRC-8/TECH-3250", 8, 0x1D, 0xFF, 0x00, true, true);
    CRC.REGISTER("CRC-8/WCDMA", 8, 0x9B, 0x00, 0x00, true, true);
    CRC.REGISTER("CRC-10/ATM", 10, 0x233, 0x000, 0x000, false, false);
    CRC.REGISTER("CRC-10/CDMA2000", 10, 0x3D9, 0x3FF, 0x000, false, false);
    CRC.REGISTER("CRC-10/GSM", 10, 0x175, 0x000, 0x3FF, false, false);
    CRC.REGISTER("CRC-11/FLEXRAY", 11, 0x385, 0x01A, 0x000, false, false);
    CRC.REGISTER("CRC-11/UMTS", 11, 0x307, 0x000, 0x000, false, false);
    CRC.REGISTER("CRC-12/CDMA2000", 12, 0xF13, 0xFFF, 0x000, false, false);
    CRC.REGISTER("CRC-12/DECT", 12, 0x80F, 0x000, 0x000, false, false);
    CRC.REGISTER("CRC-12/GSM", 12, 0xD31, 0x000, 0xFFF, false, false);
    CRC.REGISTER("CRC-12/UMTS", 12, 0x80F, 0x000, 0x000, false, true);
    CRC.REGISTER("CRC-13/BBC", 13, 0x1CF5, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-14/DARC", 14, 0x0805, 0x0000, 0x0000, true, true);
    CRC.REGISTER("CRC-14/GSM", 14, 0x202D, 0x0000, 0x3FFF, false, false);
    CRC.REGISTER("CRC-15/CAN", 15, 0x4599, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-15/MPT1327", 15, 0x6815, 0x0000, 0x0001, false, false);
    CRC.REGISTER("CRC-16/ARC", 16, 0x8005, 0x0000, 0x0000, true, true);
    CRC.REGISTER("CRC-16/CDMA2000", 16, 0xC867, 0xFFFF, 0x0000, false, false);
    CRC.REGISTER("CRC-16/CMS", 16, 0x8005, 0xFFFF, 0x0000, false, false);
    CRC.REGISTER("CRC-16/DDS-110", 16, 0x8005, 0x800D, 0x0000, false, false);
    CRC.REGISTER("CRC-16/DECT-R", 16, 0x0589, 0x0000, 0x0001, false, false);
    CRC.REGISTER("CRC-16/DECT-X", 16, 0x0589, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/DNP", 16, 0x3D65, 0x0000, 0xFFFF, true, true);
    CRC.REGISTER("CRC-16/EN-13757", 16, 0x3D65, 0x0000, 0xFFFF, false, false);
    CRC.REGISTER("CRC-16/GENIBUS", 16, 0x1021, 0xFFFF, 0xFFFF, false, false);
    CRC.REGISTER("CRC-16/GSM", 16, 0x1021, 0x0000, 0xFFFF, false, false);
    CRC.REGISTER("CRC-16/IBM-3740", 16, 0x1021, 0xFFFF, 0x0000, false, false);
    CRC.REGISTER("CRC-16/IBM-SDLC", 16, 0x1021, 0xFFFF, 0xFFFF, true, true);
    CRC.REGISTER("CRC-16/ISO-IEC-14443-3-A", 16, 0x1021, 0xC6C6, 0x0000, true, true);
    CRC.REGISTER("CRC-16/KERMIT", 16, 0x1021, 0x0000, 0x0000, true, true);
    CRC.REGISTER("CRC-16/LJ1200", 16, 0x6F63, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/MAXIM-DOW", 16, 0x8005, 0x0000, 0xFFFF, true, true);
    CRC.REGISTER("CRC-16/MCRF4XX", 16, 0x1021, 0xFFFF, 0x0000, true, true);
    CRC.REGISTER("CRC-16/MODBUS", 16, 0x8005, 0xFFFF, 0x0000, true, true);
    CRC.REGISTER("CRC-16/NRSC-5", 16, 0x080B, 0xFFFF, 0x0000, true, true);
    CRC.REGISTER("CRC-16/OPENSAFETY-A", 16, 0x5935, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/OPENSAFETY-B", 16, 0x755B, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/PROFIBUS", 16, 0x1DCF, 0xFFFF, 0xFFFF, false, false);
    CRC.REGISTER("CRC-16/RIELLO", 16, 0x1021, 0xB2AA, 0x0000, true, true);
    CRC.REGISTER("CRC-16/SPI-FUJITSU", 16, 0x1021, 0x1D0F, 0x0000, false, false);
    CRC.REGISTER("CRC-16/T10-DIF", 16, 0x8BB7, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/TELEDISK", 16, 0xA097, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/TMS37157", 16, 0x1021, 0x89EC, 0x0000, true, true);
    CRC.REGISTER("CRC-16/UMTS", 16, 0x8005, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-16/USB", 16, 0x8005, 0xFFFF, 0xFFFF, true, true);
    CRC.REGISTER("CRC-16/XMODEM", 16, 0x1021, 0x0000, 0x0000, false, false);
    CRC.REGISTER("CRC-17/CAN-FD", 17, 0x1685B, 0x00000, 0x00000, false, false);
    CRC.REGISTER("CRC-21/CAN-FD", 21, 0x102899, 0x000000, 0x000000, false, false);
    CRC.REGISTER("CRC-24/BLE", 24, 0x00065B, 0x555555, 0x000000, true, true);
    CRC.REGISTER("CRC-24/FLEXRAY-A", 24, 0x5D6DCB, 0xFEDCBA, 0x000000, false, false);
    CRC.REGISTER("CRC-24/FLEXRAY-B", 24, 0x5D6DCB, 0xABCDEF, 0x000000, false, false);
    CRC.REGISTER("CRC-24/INTERLAKEN", 24, 0x328B63, 0xFFFFFF, 0xFFFFFF, false, false);
    CRC.REGISTER("CRC-24/LTE-A", 24, 0x864CFB, 0x000000, 0x000000, false, false);
    CRC.REGISTER("CRC-24/LTE-B", 24, 0x800063, 0x000000, 0x000000, false, false);
    CRC.REGISTER("CRC-24/OPENPGP", 24, 0x864CFB, 0xB704CE, 0x000000, false, false);
    CRC.REGISTER("CRC-24/OS-9", 24, 0x800063, 0xFFFFFF, 0xFFFFFF, false, false);
    CRC.REGISTER("CRC-30/CDMA", 30, 0x2030B9C7, 0x3FFFFFFF, 0x3FFFFFFF, false, false);
    CRC.REGISTER("CRC-31/PHILIPS", 31, 0x04C11DB7, 0x7FFFFFFF, 0x7FFFFFFF, false, false);
    CRC.REGISTER("CRC-32/AIXM", 32, 0x814141AB, 0x00000000, 0x00000000, false, false);
    CRC.REGISTER("CRC-32/AUTOSAR", 32, 0xF4ACFB13, 0xFFFFFFFF, 0xFFFFFFFF, true, true);
    CRC.REGISTER("CRC-32/BASE91-D", 32, 0xA833982B, 0xFFFFFFFF, 0xFFFFFFFF, true, true);
    CRC.REGISTER("CRC-32/BZIP2", 32, 0x04C11DB7, 0xFFFFFFFF, 0xFFFFFFFF, false, false);
    CRC.REGISTER("CRC-32/CD-ROM-EDC", 32, 0x8001801B, 0x00000000, 0x00000000, true, true);
    CRC.REGISTER("CRC-32/CKSUM", 32, 0x04C11DB7, 0x00000000, 0xFFFFFFFF, false, false);
    CRC.REGISTER("CRC-32/ISCSI", 32, 0x1EDC6F41, 0xFFFFFFFF, 0xFFFFFFFF, true, true);
    CRC.REGISTER("CRC-32/ISO-HDLC", 32, 0x04C11DB7, 0xFFFFFFFF, 0xFFFFFFFF, true, true);
    CRC.REGISTER("CRC-32/JAMCRC", 32, 0x04C11DB7, 0xFFFFFFFF, 0x00000000, true, true);
    CRC.REGISTER("CRC-32/MPEG-2", 32, 0x04C11DB7, 0xFFFFFFFF, 0x00000000, false, false);
    CRC.REGISTER("CRC-32/XFER", 32, 0x000000AF, 0x00000000, 0x00000000, false, false);

    if (typeof Cell !== "undefined") {
        Cell.CRC = CRC;
        if (Cell.developmentMode()) {
            console.log(Cell.message("CRC", "CRC.SUPPORTED", CRC.REGISTERED_ALGORITHMS()));
        }
    } else {
        console.log(Cell.message("CRC", "CRC.SUPPORTED", CRC.REGISTERED_ALGORITHMS()));
    }
})();