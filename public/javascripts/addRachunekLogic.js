const rodzajSelectElement = document.querySelector('#rodzaj');
const poleInputElements = document.querySelectorAll('.pole_input');
const walutaSelectElement = document.querySelector('#waluta');
//const kwotaInputElement = document.querySelector('#kwota');
const poleLabelElements = document.querySelectorAll('.pole_label');

const refreshPola = function () {
    let rodzaj = rodzajSelectElement.value;
    let input_mode;
    let default_value;
    let label;
    switch(rodzaj) {
        case '1':
            input_mode = 'checkbox';
            label='';
            break;
        case '2':
            input_mode = 'number';
            default_value = 5;
            label='%';
            break;
        case '3':
            input_mode = 'number';
            default_value = 1;
            label='sztuki';
            break;
        default:
            input_mode = 'number';
            default_value = 0;
            label = walutaSelectElement.options[walutaSelectElement.selectedIndex].text;
            break;
    }
    for(let element of poleInputElements) {
        element.type = input_mode;
        element.value = default_value;
    }
    for(let element of poleLabelElements) {
        element.innerHTML = label;
    }
}

rodzajSelectElement.addEventListener('change', refreshPola);
rodzajSelectElement.addEventListener('click', refreshPola);
walutaSelectElement.addEventListener('change', refreshPola);
addEventListener('load', refreshPola);