const checkIfURLIsImage = url => {
    let string = url.split('.');
    if (string.length > 0) {
        return (string[string.length - 1].toLowerCase() === 'jpg' ||
            string[string.length - 1].toLowerCase() === 'jpeg' ||
            string[string.length - 1].toLowerCase() === 'png');
    } else {
        return false;
    }
};

const transformStringToReais = string => {
    if (typeof string == 'number') {
        string = string.toFixed(2);
    }
    string = 'R$ ' + string;
    if (string.includes('.') || string.includes(',')) {
        string = string.replace('.', ',');
    } else {
        string = string + ',00';
    }
    return string;
};

const transformReaisToFloat = string => {
    string = string.replace(',', '.');
    string = string.replace('R$ ', '');
    return Number(string);
};

const numberIsBetween = (number, start, end) => {
    return (number >= start) && (number <= end);
}

export {checkIfURLIsImage, transformStringToReais, transformReaisToFloat, numberIsBetween};