/****************************************************************
* Fisheye Distortion Plugin
* https://github.com/d3/d3-plugins/blob/master/fisheye/fisheye.js
****************************************************************/
(function () {
    d3.fisheye = {
        scale: function (scaleType) {
            return d3_fisheye_scale(scaleType(), 3, 0, 1);
        },
        circular: function () {
            var radius = 200,
                distortion = 2,
                k0,
                k1,
                focus = [0, 0];

            function fisheye(d) {
                var dx = d.x - focus[0],
                    dy = d.y - focus[1],
                    dd = Math.sqrt(dx * dx + dy * dy);
                if (!dd || dd >= radius) return { x: d.x, y: d.y, z: 1 };
                var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
                return { x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10) };
            }

            function rescale() {
                k0 = Math.exp(distortion);
                k0 = k0 / (k0 - 1) * radius;
                k1 = distortion / radius;
                return fisheye;
            }

            fisheye.radius = function (_) {
                if (!arguments.length) return radius;
                radius = +_;
                return rescale();
            };

            fisheye.distortion = function (_) {
                if (!arguments.length) return distortion;
                distortion = +_;
                return rescale();
            };

            fisheye.focus = function (_) {
                if (!arguments.length) return focus;
                focus = _;
                return fisheye;
            };

            return rescale();
        }
    };

    function d3_fisheye_scale(scale, d, a, p) {

        function fisheye(_) {
            var x = scale(_),
                left = x < a,
                range = d3.extent(scale.range()),
                min = range[0],
                max = range[1],
                m = left ? a - min : max - a,
                dp = Math.pow(d, p);
            if (m == 0) return left? min : max;
            return a + (left ? -1 : 1) *  m  * 
              Math.pow( 
                (dp + 1)
              / (dp + (m / Math.abs(x-a) ) )
              , p);
        }
      
        fisheye.power = function(_) {
            if (!arguments.length) return p;
            p = +_;
            return fisheye;
       };

        fisheye.distortion = function (_) {
            if (!arguments.length) return d;
            d = +_;
            return fisheye;
        };

        fisheye.focus = function (_) {
            if (!arguments.length) return a;
            a = +_;
            return fisheye;
        };

        fisheye.copy = function () {
            return d3_fisheye_scale(scale.copy(), d, a);
        };

        fisheye.nice = scale.nice;
        fisheye.ticks = scale.ticks;
        fisheye.tickFormat = scale.tickFormat;
        fisheye.exponent = function(_) {
          //allow power scales
          if (!arguments.length) 
            return (scale.exponent)? 
              scale.exponent():undefined;
          //else:
          if (scale.exponent) 
              scale.exponent(_);
          return fisheye;
        }
      
        return d3.rebind(fisheye, scale, "domain", "range");
    }
})();