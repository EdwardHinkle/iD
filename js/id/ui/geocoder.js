iD.ui.geocoder = function() {

    var map;

    function geocoder(selection) {
        function keydown() {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
            d3.json('http://a.tiles.mapbox.com/v3/openstreetmap.map-hn253zqn/geocode/' +
                encodeURIComponent(this.value) + '.json', function(err, resp) {
                if (err) return hide();
                hide();
                if (!resp.results.length) {
                    return iD.ui.flash()
                        .select('.content')
                        .append('h3')
                        .text('No location found for "' + resp.query[0] + '"');
                }
                var bounds = resp.results[0][0].bounds;
                map.extent(iD.geo.Extent([bounds[0], bounds[1]], [bounds[2], bounds[3]]));
            });
        }

        function clickoutside(selection) {
            selection
                .on('click.geocoder-inside', function() {
                    return d3.event.stopPropagation();
                });
            d3.select('body').on('click.geocoder-outside', hide);
        }

        function show() { setVisible(true); }
        function hide() { setVisible(false); }
        function toggle() { setVisible(gcForm.classed('hide')); }

        function setVisible(show) {
            button.classed('active', show);
            gcForm.classed('hide', !show);
            var input_node = d3.select('.map-overlay input').node();
            if (show) input_node.focus();
            else input_node.blur();
        }

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', window.i18n.id.find_location())
            .html('<span class=\'geocode icon\'></span>')
            .on('click', toggle);

        var gcForm = selection.append('form');

        gcForm.attr('class','content fillD map-overlay hide')
            .append('input')
                .attr({ type: 'text', placeholder: window.i18n.id.find_placeholder() })
                .on('keydown', keydown);

        selection.call(clickoutside);
    }

    geocoder.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        return geocoder;
    };

    return geocoder;
};
