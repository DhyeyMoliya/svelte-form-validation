<script lang="ts">
	import { createForm } from '$lib';
	import * as yup from 'yup';

	// Create Form Instance
	const { values, formControl, isValid } = createForm({
		initialValues: {
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

<h1>Test</h1>
<div class="container">
	<form on:submit|preventDefault={onSubmit} class="row g-2">
		<div class="col-auto">
			<input
				type="text"
				name="email"
				placeholder="Email"
				bind:value={$values.email}
				use:formControl
				class="form-control"
			/>
		</div>
		<div class="col-auto">
			<input
				type="password"
				name="password"
				placeholder="Password"
				bind:value={$values.password}
				use:formControl
				class="form-control"
			/>
		</div>
		<div class="col-auto">
			<button type="submit" disabled={!$isValid} class="btn btn-primary">Submit</button>
		</div>
	</form>
</div>
