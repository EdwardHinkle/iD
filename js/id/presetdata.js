iD.presetData = function() {

    var other = {
        name: 'other',
        title: 'Other',
        icon: 'marker-stroked',
        match: {
            tags: {},
            type: ['node', 'line', 'area']
        },
        form: []
    };

    var presets = {},
        data = [other],
        categories = [],
        defaults = {
            node: [],
            area: [],
            line: []
        };

    function getPreset(name) {
        return _.find(data.concat(categories), function(d) {
            return d.name === name;
        });
    }

    presets.data = function(_) {
        if (!arguments.length) return data;
        data = _.presets.concat([other]);
        categories = _.categories;
        defaults = _.defaults;
        return presets;
    };

    presets.defaults = function(entity) {
        var type = entity.type === 'node' ? 'node' : entity.geometry();
        return defaults[type].map(getPreset);
    };

    presets.categories = function(category) {
        if (!arguments.length) return categories;
        return _.find(categories, function(d) {
            return d.name === category;
        }).members.map(getPreset);
    };

    presets.match = function(entity) {
        var type = entity.type === 'node' ? 'node' : entity.geometry();
        return data.concat(categories).filter(function(d) {
            return _.contains(d.match.type, type);
        });
    };

    presets.matchTags = function(entity) {
        var tags, count, best,
            maxcount = -1;

        for (var i = 0; i < data.length; i++) {
            count = 0;
            tags = data[i].match.tags;

            for (var k in tags) {
                if (entity.tags[k] === tags[k] || (tags[k] === '*' && k in entity.tags)) count++;
                else break;
            }

            if (Object.keys(tags).length === count && count > maxcount) {
                best = data[i];
                maxcount = count;
            }
        }

        return best;
    };

    return presets;
};
