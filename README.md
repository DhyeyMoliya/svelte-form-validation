# Welcome to svelte-form-validation 👋

[![NPM Version](https://img.shields.io/npm/v/svelte-form-validation.svg?orange=blue)](https://npmjs.org/package/svelte-form-validation)

> Svelte Form Validation Library

### 🏠 [Homepage](https://github.com/DhyeyMoliya/svelte-form-validation#readme)

## Install

```sh
npm install svelte-form-validation
```

> This package uses a popular Schema Validation library **[Yup](https://github.com/jquense/yup)**. For documentation on how to create Validation Schema, checkout Yup's official Github Repo https://github.com/jquense/yup.

## Basic Usage Example

_[src/routes/basic.svelte](https://github.com/DhyeyMoliya/svelte-form-validation/blob/master/src/routes/basic.svelte)_ :

```html
<script>
	import { createForm } from 'svelte-form-validation';
	import * as yup from 'yup';

	// Create Form Instance
	const { values, formControl, isValid } = createForm({
		// Initial Form Data
		values: {
			email: '',
			password: ''
		},
		// Form Validation using Yup
		validationSchema: yup.object().shape({
			email: yup.string().email().required(),
			password: yup.string().min(6).required()
		})
	});

	const onSubmit = () => {
		// "$values" contains current Form Data
		console.log($values);
	};
</script>

<form on:submit|preventDefault="{onSubmit}">
	<input type="text" name="email" bind:value="{$values.email}" use:formControl />
	<input type="password" name="password" bind:value="{$values.password}" use:formControl />

	<button type="submit" disabled="{!$isValid}">Submit</button>
</form>
```

## Full Usage Example

_[demo/Full.svelte](https://github.com/DhyeyMoliya/svelte-form-validation/blob/master/demo/Full.svelte)_ :

```html
<script lang="ts">
  import { createForm } from "svelte-form-validation";
  import * as yup from 'yup';
  import UserAddressForm from "./UserAddressForm.svelte"; // Components

  // (Optional) Form's Data type will be automatically inferred from "values" in "createForm" if type of Data is not specified
  type FormData = {
    title: string,
    description: string,
    coverImage: FileList,
    users: {
      name: string,
      email: string,
      address: {
        state: string,
        city: string,
      },
    }[],
  };

  // Create Form Instance
  const {
    values, // Svelte Store<FormData> containing Form Data
    state, // Svelte Store<FormState> containing Form State - { [every_property]: { _touched: boolean, _errors: string[] }}
    isValid, // Svelte Store<boolean> containing entire Form's validation status
    isTouched, // Svelte Store<boolean> containing entire Form's touched status
    validateForm, // Function(highlight: 'none' | 'errors' | 'all' = 'none') for manually validting entire form
    handleChange, // Function(event: Event) to manually updating individual form control's state - can be used in place of "formControl" Action
    setTouched, // Function() for manually setting Form state as "touched"
    updateForm, // Function() for updating Form's Structure after Form Controls are Added or Removed in cases like Form Arrays
    formControl, // Svelte Action to be used with <input>, <select>, <textarea> or similar HTML input elements
    resetForm, // Reset the Form with optional new value and clear validation
  } = createForm<FormData>({
    // Initial Values of Form
    values: {
      title: "", // Simple String
      description: "", // Simple String
      coverImage: "", // File Input
      users: [], // Complex Form Array
    },
    // Validation Schema (Yup - https://github.com/jquense/yup)
    validationSchema: yup.object().shape({
      title: yup.string().min(8).required(),
      description: yup.string(),
      coverImage: yup.mixed().test(value => value?.length > 0), // Custom validation because yup does not suport file objects
      users: yup.array().of(
        yup.object().shape({
          name: yup.string().required(),
          email: yup.string().email().required(),
          address: yup.object().shape({
            state: yup.string().required(),
            city: yup.string(),
          }),
        }),
      )
    }),
    // CSS class validations
    css: {
      enabled: true, // use CSS classes or not
      validClass: "is-valid", // CSS class added to valid form controls
      invalidClass: "is-invalid", // CSS class added to invalid form controls
      useValid: true, // Add CSS classes to valid form controls
      useInvalid: true, // Add CSS classes to invalid form controls
    },
    validateOnChange: true, // Whether to validate on "change" event of element and form value change
    validateOnBlur: true, // Whether to validate on "blur" event of element
  });

  // Add new user to Users Form Array
  const addUser = () => {
    // Update Form Data
    $values.users = [
      ...$values.users,
      {
        name: "",
        email: "",
        address: {
          state: "",
          city: "",
        },
      },
    ];
    updateForm(); // Manually trigger Form Update - Required
  };

  // Remove user from Users Form Array
  const removeUser = (index) => () => {
    $values.users = $values.users.filter((_, i) => i !== index); // Update Form Data
    $state.users = $state.users.filter((_, i) => i !== index); // Updating State is required after removing Form Controls
    updateForm(); // Manually trigger Form Update - Required
  };

  // Submit Form
  const onSubmit = () => {
    console.log($values); // Get Form Data
    // Reset form after submit
    resetForm({
      title: "",
      description: "",
      coverImage: "",
      users: [],
    });
  };

  $: console.log($values, $state); // Log Form Data and Form State on every Change
</script>

<form on:submit|preventDefault={onSubmit}>

    <input
        placeholder="Title"
        name="title"
        bind:value={$values.title}
        use:formControl
    />
    {#if $state.title._errors?.length}
        {#each $state.title._errors as error}
            <span class="error">{error}</span>
        {/each}
    {/if}

    <input
        placeholder="Description"
        name="description"
        bind:value={$values.description}
        use:formControl
    />
    {#if $state.description._errors?.length}
        {#each $state.description._errors as error}
            <span class="error">{error}</span>
        {/each}
    {/if}

    <input
        name="coverImage"
        accept="image/*"
        bind:files={$values.coverImage}
        use:formControl
        type="file"
    />
    {#if $state.coverImage._errors?.length}
        {#each $state.coverImage._errors as error}
        <span class="error">{error}</span>
        {/each}
    {/if}

    {#if $values.coverImage?.length}
        <div class="image-preview">
            <img
            src={URL.createObjectURL($values.coverImage[0])}
            alt="Cover"
            height="150" />
        </div>
    {/if}

    {#each $values.users as user, index}
        <h2>
            User {user.name}
            <button type="button" on:click={removeUser(index)}>
                Remove User
            </button>
        </h2>

        <input
            placeholder="name"
            name="users[{index}].name"
            bind:value={user.name}
            use:formControl
        />
        {#if $state.users[index].name._errors?.length}
            {#each $state.users[index].name._errors as error}
                <span class="error">{error}</span>
            {/each}
        {/if}

        <input
            placeholder="email"
            name="users[{index}].email"
            bind:value={user.email}
            use:formControl
        />
        {#if $state.users[index].email._errors?.length}
            {#each $state.users[index].email._errors as error}
                <span class="error">{error}</span>
            {/each}
        {/if}

        <!-- Using with Components -->
        <UserAddressForm {values} {state} {formControl} {index} />

    {/each}

    <button type="button" on:click={addUser}>
        Add User
    </button>

    <button type="button" on:click={() => validateForm('errors')}>
        Validate Form
    </button>

    <button type="submit" disabled={!$isValid}>
        Submit
    </button>

</form>

<style>
    .valid {
        border: 1px solid green;
    }

    .invalid {
        border: 1px solid red;
    }

    .error {
        color: red;
    }
</style>
```

_[demo/UserAddressForm.svelte](https://github.com/DhyeyMoliya/svelte-form-validation/blob/master/demo/UserAddressForm.svelte)_ :

```html
<script lang="ts">
	export let values: any;
	export let state: any;
	export let formControl;
	export let index: number;
</script>

<div>
	<input
		type="text"
		placeholder="State"
		bind:value="{$values.users[index].address.state}"
		name="users[{index}].address.state"
		use:formControl
	/>
	{#if $state.users[index].address.state._errors?.length}
	<div>
		{#each $state.users[index].address.state._errors as error}
		<span class="error">{error}</span>
		{/each}
	</div>
	{/if}

	<input
		type="text"
		placeholder="City"
		bind:value="{$values.users[index].address.city}"
		name="users[{index}].address.city"
		use:formControl
	/>
	{#if $state.users[index].address.city._errors?.length}
	<div>
		{#each $state.users[index].address.city._errors as error}
		<span class="error">{error}</span>
		{/each}
	</div>
	{/if}
</div>
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/DhyeyMoliya/svelte-form-validation/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is [MIT](https://github.com/DhyeyMoliya/svelte-form-validation/blob/master/LICENSE.md) licensed.
