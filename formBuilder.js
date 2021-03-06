var forms = require('forms');
var fields = forms.fields;
var validators = forms.validators;
var widgets = require('forms').widgets;
var fs = require('fs');


var reg_form = forms.create({
    username: fields.string({ required: true }),
    password: fields.password({ required: validators.required('You definitely want a password') }),
    confirm:  fields.password({
        required: validators.required('don\'t you know your own password?'),
        validators: [validators.matchField('password')]
    }),
    email: fields.email()
});



var my_form = forms.create({
    title: fields.string({
        required: true,
        widget: widgets.text({ classes: ['input-with-feedback'] }),
        errorAfterField: true,
        cssClasses: {
            label: ['control-label col col-lg-3']
        }
    }),
    description: fields.string({
        errorAfterField: true,
        widget: widgets.text({ classes: ['input-with-feedback'] }),
        cssClasses: {
            label: ['control-label col col-lg-3']
        }
    })
});

var bootstrapField = function (name, object) {
    if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }
    if (object.widget.classes.indexOf('form-control') === -1) {
        object.widget.classes.push('form-control');
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<div class="alert alert-error help-block">' + object.error + '</div>' : '';

    var validationclass = object.value && !object.error ? 'has-success' : '';
    validationclass = object.error ? 'has-error' : validationclass;

    var widget = object.widget.toHTML(name, object);
    return '<div class="form-group ' + validationclass + '">' + label + widget + error + '</div>';
};

fs.writeFile('public/formDiv.html', reg_form.toHTML(bootstrapField), function(err) {
	if(err) {
		return console.log(err);
	}
	console.log("The file was saved successfully");
});