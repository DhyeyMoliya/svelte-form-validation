<script>
	import { createForm } from '$lib';
	import * as yup from 'yup';

	const { values, formControl, isValid } = createForm({
		values: {
			email: '',
			password: ''
		},
		validationSchema: yup.object().shape({
			email: yup.string().email().required(),
			password: yup.string().min(6).required()
		})
	});

	const onSubmit = () => {
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
