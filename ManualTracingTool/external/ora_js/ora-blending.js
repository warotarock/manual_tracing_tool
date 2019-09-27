(function (obj) {
    'use strict';
    // Layer blending functionality
    // Based on http://dev.w3.org/fxtf/compositing-1/


    // Draw a layer on top of another using the given blending mode
    // src - RGBA data of top layer
    // dst - RGBA data of bottom layer
    // opacity - top layer opacity
    // filter - compositing function to use
    function applyBlending(src, dst, opacity, filter) {
        // calculate alpha blending of filter
        // Cs/Cd - source/destination color
        // As/Ad - source/destination alpha
        function blend(Cs, Cd, As, Ad) {
            return As * (1 - Ad) * Cs + As * Ad * filter(Cs, Cd) + (1 - As) * Ad * Cd;
        }

        for (var i = 0, n = dst.length; i < n; i += 4)
        {
            var srcA = (src[i+3] / 255) * opacity;
            if (srcA === 0) {
                continue;
            }

            var dstA = dst[i+3] / 255;

            var blendAlpha = srcA + dstA - dstA * srcA;

            dst[i  ] = blend(src[i  ] / 255, dst[i  ] / 255, srcA, dstA) / blendAlpha * 255; // r
            dst[i+1] = blend(src[i+1] / 255, dst[i+1] / 255, srcA, dstA) / blendAlpha * 255; // g
            dst[i+2] = blend(src[i+2] / 255, dst[i+2] / 255, srcA, dstA) / blendAlpha * 255; // b
            dst[i+3] = blendAlpha * 255; // a
        }
    }

    // Implementations of blending filters

    function sourceOverFilter(src, dst) {
        return src;
    }

    function multiplyFilter(src, dst) {
        var mlt = src * dst;
        return Math.min(mlt, 1);
    }

    function screenFilter(src, dst) {
        var screenf = dst + src - (dst * src);
        return Math.max(screenf, 0);
    }

    function overlayFilter(src, dst) {
        return hardLightFilter(dst, src);
    }

    function dodgeFilter(src, dst) {
        if (dst === 0) {
            return 0;
        }

        if (src === 1) {
            return 1;
        }

        var dodge = dst  / (1 - src);
        return Math.min(dodge, 1);
    }

    function burnFilter(src, dst) {
        /*if (dst === 1) {
            return 1;
        }*/

        if (src === 0) {
            return 0;
        }

        var burn = 1 - ((1 - dst) / src);
        return Math.max(burn, 0);
    }

    function darkenFilter(src, dst) {
        return Math.min(src, dst);
    }

    function lightenFilter(src, dst) {
        return Math.max(src, dst);
    }

    function plusFilter(src, dst) {
        return Math.min(src + dst, 1);
    }

    function hardLightFilter(src, dst) {
        if (src < 0.5) {
            return multiplyFilter(2 * src, dst);
        } else {
            return screenFilter((2 * src) - 1, dst);
        }
    }

    function softLightFilter(src, dst) {
        if (src <= 0.5) {
            return dst - ((1 - (2 * src)) * dst * (1 - dst));
        }
        else {
            var d;

            if (dst <= 0.25) {
                d = (((16 * dst) - 12) * dst + 4) * dst;
            } else {
                d = Math.sqrt(dst);
            }

            return dst + ((2 * src) - 1) * (d - dst);
        }
    }

    function differenceFilter(src, dst) {
        return Math.abs(src - dst);
    }

    self.blending = {
        normal: sourceOverFilter,
        multiply: multiplyFilter,
        screen: screenFilter,
        overlay: overlayFilter,
        dodge: dodgeFilter,
        burn: burnFilter,
        darken: darkenFilter,
        lighten: lightenFilter,
        plus: plusFilter,
        difference: differenceFilter,
        hardLight: hardLightFilter,
        softLight: softLightFilter,

        'svg:src-over': sourceOverFilter,
        'svg:multiply': multiplyFilter,
        'svg:screen': screenFilter,
        'svg:overlay': overlayFilter,
        'svg:color-dodge': dodgeFilter,
        'svg:color-burn': burnFilter,
        'svg:darken': darkenFilter,
        'svg:lighten': lightenFilter,
        'svg:plus': plusFilter,
        'svg:difference': differenceFilter,
        'svg:hard-light': hardLightFilter,
        'svg:soft-light': softLightFilter,

        //'svg:color'
        //'svg:luminosity'
        //'svg:hue'
        //'svg:saturation'

        blend: applyBlending
    };
})();