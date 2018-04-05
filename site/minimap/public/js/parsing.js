function checkJsonHas(json, fieldName, typeName) {
    if (json[fieldName] === undefined) {
        var json_str = JSON.stringify(json, null, 2); // spacing level = 2
        alert(`Json Parse Error: Missing '${fieldName}' when parsing '${typeName}'.\n\nGot JSON ${json_str}`);
        return null;
    }
    return json[fieldName];
}
