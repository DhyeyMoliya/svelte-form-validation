import type { Writable, Unsubscriber } from 'svelte/store';
import { get, writable } from 'svelte/store';
import type { ObjectSchema, ValidationError } from 'yup';

type FormState = {
    [key: string]: {
        _touched?: boolean,
        _errors?: string[],
        [key: string]: any,
    }
};

type FormConfigInput<Data = any> = {
    values: Data,
    validationSchema?: ObjectSchema<any>,
    css?: {
        enabled?: boolean,
        validClass?: string,
        invalidClass?: string,
        useValid?: boolean,
        useInvalid?: boolean,
    }
    validateOnChange?: boolean,
    validateOnBlur?: boolean,
};

function isNullish(value) {
    return value === undefined || value === null;
}

function isEmpty(object) {
    return isNullish(object) || Object.keys(object).length <= 0;
}

const createState = (values: any, state: Writable<FormState>, validationSchema: ObjectSchema<any>) => {
    if (validationSchema) {
        state.set(createValidatedState(values, validationSchema.fields));
    } else {
        state.set(createRawState(values));
    }
}

const createValidatedState = <Data = any>(data: Data, schema: ObjectSchema<any>, state: FormState = {}) => {
    for (let key in schema) {
        if (schema[key].type === 'array') {
            const values = ((data?.[key] || []) as any[]);
            state[key] = values.map(
                (value, index) => createValidatedState(value, schema[key].innerType.fields, Object.assign({}, state[key]?.[index]))
            );
            state[key]._errors = [];
        } else if (schema[key].type === 'object' && !isEmpty(schema[key].fields)) {
            state[key] = {
                ...createValidatedState(data[key], schema[key].fields, Object.assign({}, state[key])),
                _errors: [],
            };
        } else {
            state[key] = {
                _touched: state?.[key]?._touched || false,
                _errors: [],
            };
        }
    }
    return state;
}

const createRawState = <Data>(data: Data, state: FormState = {}): FormState => {
    for (let key in data) {
        if (Array.isArray(data[key])) {
            const values = (data[key] || []) as any[];
            state[key] = values.map(
                (value, index) => createRawState(value, Object.assign({}, state[key]?.[index]))
            );
            state[key]._errors = [];
        } else if (typeof data[key] === 'object') {
            state[key] = {
                ...createRawState(data[key], Object.assign({}, state[key])),
                _errors: [],
            };
        } else {
            state[key] = {
                _touched: state?.[key]?._touched || false,
                _errors: [],
            };
        }
    }

    return state;
}

const validate = <Data = any>(form: Writable<Data>, schema: ObjectSchema<any>, state: Writable<FormState>, touchValid = false, touchInvalid = false) => {
    try {
        schema.validateSync(get(form), { abortEarly: false });
        clearErrors(state, touchValid);
        return true;
    } catch (error) {
        setErrors(state, error, touchValid, touchInvalid);
        return false;
    }
}

const clearErrors = (state: Writable<FormState> | any, touch = false, inner = false, update = true) => {
    try {
        let data = !inner ? get(state) : state;
        for (let key in data) {
            if (key !== '_touched' && key !== '_errors') {
                if (Array.isArray(data[key])) {
                    let values = (data[key] || []) as any[];
                    data[key] = values.map(
                        value => clearErrors(value, touch, true, update)
                    );
                    data[key]._touched = typeof data[key]?._touched === 'boolean' && !touch ? data[key]._touched : touch;
                    data[key]._errors = [];
                } else if (typeof data[key] === 'object') {
                    data[key] = {
                        ...clearErrors(data[key], touch, true, update),
                        _touched: typeof data[key]?._touched === 'boolean' && !touch ? data[key]._touched : touch,
                        _errors: [],
                    };
                } else {
                    data[key] = {
                        _touched: typeof data[key]?._touched === 'boolean' && !touch ? data[key]._touched : touch,
                        _errors: [],
                    };
                }
            }
        }
        if (!inner) {
            update && state.set(data as FormState);
            return data;
        } else {
            return data;
        }
    } catch (error) {
        console.error(error);
        return state;
    }
}

const setErrors = (state: Writable<FormState>, mainError: ValidationError, touchValid = false, touchInvalid = false) => {
    try {
        let _state = get(state);
        _state = clearErrors(_state, touchValid, true, false);
        for (let error of mainError.inner) {
            let segments = error.path.toString().match(/[^.[\]]+/g) || [];

            let obj = _state;
            if (segments.length > 1) {
                const objSegments = segments.slice(0, segments.length - 1);
                let exists = true;
                for (let segment of objSegments) {
                    if (!obj[segment]) {
                        exists = false;
                        break;
                    }
                    obj = obj[segment];
                }
                if (!exists) {
                    break;
                }
            }

            let lastSegment = segments[segments.length - 1];
            if (!obj[lastSegment]) { obj[lastSegment] = { touched: false, _errors: [] }; }
            if (!obj[lastSegment]._errors) { obj[lastSegment]._errors = []; }
            obj[lastSegment]._errors.push(error.message);
            obj[lastSegment]._touched = typeof obj[lastSegment]._touched === 'boolean' && !touchInvalid ? obj[lastSegment]._touched : touchInvalid;
        }
        state.set(_state);

    } catch (error) {
        console.error(error);
    }
}

const updateFieldTouched = (name: string, state: Writable<FormState>) => {
    let segments = name.toString().match(/[^.[\]]+/g) || [];
    let _state = get(state);
    let obj = _state;
    let exists = true;
    if (segments.length > 1) {
        const objSegments = segments.slice(0, segments.length - 1);
        for (let segment of objSegments) {
            if (!obj[segment]) {
                exists = false;
                break;
            }
            obj = obj[segment];
        }
    }

    if (exists) {
        let lastSegment = segments[segments.length - 1];

        if (obj[lastSegment]) {
            obj[lastSegment]._touched = true;
        }
    }
    state.set(_state);
}

const updateState = (form: Writable<any>, validationSchema: ObjectSchema<any>, state: Writable<FormState>) => {
    let _state = get(state);
    if (validationSchema) {
        _state = createValidatedState(get(form), validationSchema.fields, JSON.parse(JSON.stringify(_state)))
    } else {
        _state = createRawState(get(form), JSON.parse(JSON.stringify(_state)));
    }
    state.set(_state);
}

const getFieldState = (name: string, $state: FormState) => {
    let segments = name.toString().match(/[^.[\]]+/g) || [];
    let obj = $state;

    const objSegments = segments.slice(0, segments.length - 1);
    for (let segment of objSegments) {
        if (!obj[segment]) {
            return null;
        }
        obj = obj[segment];
    }
    let lastSegment = segments[segments.length - 1];
    return obj[lastSegment] || null;
}

export function createForm<Data>({ values: initialValues, validationSchema, css: cssConfig, validateOnChange, validateOnBlur }: FormConfigInput<Data>) {
    const values = writable<Data>(initialValues);
    const state = writable<FormState>({});
    const isValid = writable<boolean>(false);
    const isTouched = writable<boolean>(false);
    const css = {
        ...{
            enabled: true,
            validClass: 'is-valid',
            invalidClass: 'is-invalid',
            useValid: true,
            useInvalid: true,
        }, ...(cssConfig || {})
    };
    validateOnChange = typeof validateOnChange !== 'boolean' ? true : validateOnChange;
    validateOnBlur = typeof validateOnBlur !== 'boolean' ? true : validateOnBlur;
    const cssValidator = writable<number>(0);
    const validationReset = writable<number>(0);

    createState(values, state, validationSchema);

    const updateForm = async () => {
        updateState(values, validationSchema, state);
        validateForm();
    };

    const validateForm = (highlight: 'none' | 'errors' | 'all' = 'none') => {
        isValid.set(validate(values, validationSchema, state, highlight === 'all', highlight === 'all' || highlight === 'errors'));
        css.enabled && !validateOnChange && highlight !== 'none' && cssValidator.update(val => val + 1);
    }

    const resetForm = (newValue?: Data) => {
        if (newValue) {
            values.set(newValue);
        }
        state.set({});
        isValid.set(false);
        isTouched.set(false);
        createState(get(values), state, validationSchema);
        validationReset.update(val => val + 1);
    }

    values.subscribe(() => {
        validationSchema && validateForm();
    });

    const handleChange = (event: Event) => {
        const target = event?.target as HTMLElement & { name: string };
        target.name && updateFieldTouched(target.name, state);
        isTouched.set(true);
    }

    const setTouched = (state: boolean) => {
        isTouched.set(state);
    }

    const formControl = (node: HTMLElement & { name: string }, options: any = {}) => {
        const changeListener = (event: Event) => {
            if (validateOnChange) {
                handleChange(event);
                css.enabled && checkValidity(get(state));
            }
        }
        const blurListener = (event: Event) => {
            if (validateOnBlur) {
                handleChange(event);
                css.enabled && checkValidity(get(state));
            }
        }
        let unsubscribeState: Unsubscriber = null;
        let unsubscribeCssValidator: Unsubscriber = null;
        let unsubscribeValidationReset: Unsubscriber = null;

        const checkValidity = async ($state: FormState) => {
            if (node.name) {
                const fieldState = getFieldState(node.name, $state);
                const invalid = fieldState?._touched && !!fieldState?._errors?.length;
                const valid = fieldState?._touched && !fieldState?._errors?.length;
                node.classList.remove(css.validClass);
                node.classList.remove(css.invalidClass);
                if (invalid) {
                    css.useInvalid && node.classList.add(css.invalidClass);
                } else if (valid) {
                    css.useValid && node.classList.add(css.validClass);
                }
            }
        }

        if (['input', 'checkbox', 'radio', 'select', 'textarea'].includes(node.tagName)
            || node.contentEditable) {
            node.addEventListener('change', changeListener);
            node.addEventListener('blur', blurListener);

            if (node.name) {
                unsubscribeState = state.subscribe($state => {
                    css.enabled && validateOnChange && checkValidity($state);
                });
                unsubscribeCssValidator = cssValidator.subscribe(() => {
                    checkValidity(get(state));
                });
                unsubscribeValidationReset = validationReset.subscribe(() => {
                    node.classList.remove(css.validClass);
                    node.classList.remove(css.invalidClass);
                })
            }
        }
        return {
            destroy() {
                node.removeEventListener('change', changeListener);
                node.removeEventListener('blur', blurListener);
                unsubscribeState && unsubscribeState();
                unsubscribeCssValidator && unsubscribeCssValidator();
                unsubscribeValidationReset && unsubscribeValidationReset();
            }
        }
    }

    return {
        values,
        state,
        isValid,
        isTouched,
        validateForm,
        handleChange,
        updateForm,
        setTouched,
        formControl,
        resetForm
    };
}