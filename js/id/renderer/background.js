iD.Background = function() {

    var tileSize = [256, 256];

    var tile = d3.geo.tile(),
        projection,
        cache = {},
        offset = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform'),
        source = d3.functor('');

    function tileSizeAtZoom(d, z) {
        return Math.ceil(tileSize[0] * Math.pow(2, z - d[2])) / tileSize[0];
    }

    function atZoom(t, distance) {
        var power = Math.pow(2, distance);
        var az = [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance];
        return az;
    }

    function lookUp(d) {
        for (var up = -1; up > -d[2]; up--) {
            if (cache[atZoom(d, up)] !== false) return atZoom(d, up);
        }
    }

    function uniqueBy(a, n) {
        var o = [], seen = {};
        for (var i = 0; i < a.length; i++) {
            if (seen[a[i][n]] === undefined) {
                o.push(a[i]);
                seen[a[i][n]] = true;
            }
        }
        return o;
    }

    function addSource(d) {
        d.push(source(d));
        return d;
    }

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background(selection) {
        var tiles = tile
            .scale(projection.scale())
            .scaleExtent((source.data && source.data.scaleExtent) || [1, 17])
            .translate(projection.translate())(),
            requests = [],
            scaleExtent = tile.scaleExtent(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0],
                Math.min(scaleExtent[1], Math.floor(z))),
            ts = tileSize[0] * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]];

        tiles.forEach(function(d) {
            addSource(d);
            requests.push(d);
            if (!cache[d[3]] && lookUp(d)) {
                requests.push(addSource(lookUp(d)));
            }
        });

        requests = uniqueBy(requests, 3).filter(function(r) {
            // don't re-request tiles which have failed in the past
            return cache[r[3]] !== false;
        });

        var pixeloffset = [
            Math.round(offset[0] * Math.pow(2, z)),
            Math.round(offset[1] * Math.pow(2, z))
        ];

        function load(d) {
            cache[d[3]] = true;
            d3.select(this)
                .on('load', null)
                .classed('tile-loaded', true);
            background(selection);
        }

        function error(d) {
            cache[d[3]] = false;
            d3.select(this)
                .on('load', null)
                .remove();
            background(selection);
        }

        function imageTransform(d) {
            var _ts = tileSize[0] * Math.pow(2, z - d[2]);
            var scale = tileSizeAtZoom(d, z);
            return 'translate(' +
                (Math.round((d[0] * _ts) - tile_origin[0]) + pixeloffset[0]) + 'px,' +
                (Math.round((d[1] * _ts) - tile_origin[1]) + pixeloffset[1]) + 'px)' +
                'scale(' + scale + ',' + scale + ')';
        }

        var image = selection
            .selectAll('img')
            .data(requests, function(d) { return d[3]; });

        image.exit()
            .style(transformProp, imageTransform)
            .classed('tile-loaded', false)
            .each(function() {
                var tile = this;
                window.setTimeout(function() {
                    // this tile may already be removed
                    if (tile.parentNode) {
                        tile.parentNode.removeChild(tile);
                    }
                }, 300);
            });

        image.enter().append('img')
            .attr('class', 'tile')
            .attr('src', function(d) { return d[3]; })
            .on('error', error)
            .on('load', load);

        image.style(transformProp, imageTransform);
    }

    background.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return background;
    };

    background.nudge = function(_, zoomlevel) {
        offset[0] += _[0] / Math.pow(2, zoomlevel);
        offset[1] += _[1] / Math.pow(2, zoomlevel);
        return background;
    };

    background.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return background;
    };

    background.size = function(_) {
        if (!arguments.length) return tile.size();
        tile.size(_);
        return background;
    };

    function setPermalink(source) {
        var tag = source.data.sourcetag;
        var q = iD.util.stringQs(location.hash.substring(1));
        if (tag) {
            location.replace('#' + iD.util.qsString(_.assign(q, {
                layer: tag
            }), true));
        } else {
            location.replace('#' + iD.util.qsString(_.omit(q, 'layer'), true));
        }
    }

    background.source = function(_) {
        if (!arguments.length) return source;
        source = _;
        setPermalink(source);
        return background;
    };

    return background;
};
