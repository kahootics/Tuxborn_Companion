
export function appendOptions(selectInput: HTMLSelectElement, options: string[]) {
        const fragment = document.createDocumentFragment();
        options.forEach((opt) => {
            const temp = document.createElement('option');
            temp.textContent = opt;
            temp.value = opt;
        fragment.appendChild(temp);
        });
        selectInput.appendChild(fragment);
    }

export function createFalseSelect(baseId: string, radios: string[], name: string) {
    const select = document.getElementById(`${baseId}-select`);
    const container = document.getElementById(`${baseId}-select-container`);
    if(!(select instanceof HTMLButtonElement && container)
    ) throw new Error('Failed building radio list, please verify baseId is correct');

    const selected = document.createElement('span');
    //
    selected.classList = 'clip-shape octagone';

    //
    // Label emulation
        const label = document.getElementById(`${select.getAttribute('aria-labelledby')}`);
        if(label) label.addEventListener('mousedown', (e) => {
            e.preventDefault();
            select.focus();
            if(select.getAttribute('aria-expanded') !== 'true') openList();
        })
    //
    const list = document.createElement('ul');
    const listId = `${baseId}-list`;
    list.hidden = true;
    list.id = listId; 
    
    select.setAttribute('aria-controls', listId);
    const DURATION = Number(window.getComputedStyle(container).getPropertyValue('--js-time'));
    console.log(DURATION)

    let _value: string;

    function setValue(value: string) {
        _value = value;
        selected.textContent = _value;
        const temp = valuesMap.get(value);
        if(temp && !temp.checked) temp.checked = true;
    }

    let _firstRadio: HTMLInputElement;

    function resetList() {
        if(_firstRadio) {
            setValue(_firstRadio.value);
        }
    }

    const valuesMap: Map<string, HTMLInputElement> = new Map();
    const fragment = document.createDocumentFragment();
    if(radios.length === 0 || (radios.length === 1 && !(radios[0]))) {
        setValue('No Options');
    } else radios.forEach((rad, i) => {
        /* console.log(radios) */
        const li = document.createElement('li');
        const temp = document.createElement('input');
        const label = document.createElement('label');
        label.textContent = rad;
        temp.type = 'radio';
        temp.value = rad;
        temp.name = name;

        valuesMap.set(rad, temp);

        if(i === 0) {
            _firstRadio = temp;
            setValue(temp.value);
        }
        temp.addEventListener('input', () => setValue(temp.value))
        label.appendChild(temp);
        li.appendChild(label);
        fragment.appendChild(li)
    })
    list.appendChild(fragment);
    container.appendChild(list);
    select.appendChild(selected);

    function openList() {
        list.hidden = false;
        requestAnimationFrame(() => select?.setAttribute('aria-expanded', 'true'));
    }

    function closeList() {
        select?.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
        list.hidden = true;
        }, DURATION)
    }

    select.addEventListener('click', (e) => {
        select.getAttribute('aria-expanded') === 'true' 
        ? closeList() : openList();
    })

    container.addEventListener('focusout', (e) => {
        if (!container.contains(e.relatedTarget as Node | null) && e.currentTarget !== label) closeList();
    });

    /* select.addEventListener('focus', () => openList()) */


    return {
        get value() {
            return _value;
        },
        set value(val: string) {
            setValue(val);
        },
        get inputs() {
            return valuesMap.values();
        },
        set disabled(disable: boolean) {
            select.disabled = disable;
        },
        reset() {
            resetList();
        }
    }
}