<script>
	import { createForm, Schema } from '$lib';

	// Create Form Instance
	const { values, formControl, isValid } = createForm({
		// Initial Form Data
		initialValues: {
			email: '',
			password: ''
		},
		// Form Validation using Yup Schema
		validationSchema: Schema.object().shape({
			email: Schema.string().email().required(),
			password: Schema.string().min(6).required()
		})
	});

	const onSubmit = () => {
		// "$values" contains current Form Data
		console.log($values);
	};
</script>

<form on:submit|preventDefault={onSubmit} class="row g-2">
	<div class="col-12">
		<input
			type="text"
			name="email"
			placeholder="Email"
			bind:value={$values.email}
			use:formControl
			class="form-control"
		/>
	</div>
	<div class="col-12">
		<input
			type="password"
			name="password"
			placeholder="Password"
			bind:value={$values.password}
			use:formControl
			class="form-control"
		/>
	</div>

	<div class="col-12 d-flex flex-column align-items-end">
		<button type="submit" disabled={!$isValid} class="btn btn-primary">Submit</button>
	</div>
</form>
