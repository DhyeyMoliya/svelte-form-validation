<script lang="ts">
	export let values: any;
	export let state: any;
	export let highlight;
	export let index: number;
</script>

<div class="col">
	<div class="row g-2">
		<div>
			<input
				type="text"
				placeholder="State"
				bind:value={$values.users[index].address.state}
				name="users[{index}].address.state"
				use:highlight
				class="form-control"
			/>
			{#if $state.users[index].address.state._errors?.length}
				<div>
					{#each $state.users[index].address.state._errors as error}
						<i><small class="d-block error">* {error}</small></i>
					{/each}
				</div>
			{/if}
		</div>

		<div>
			<input
				type="text"
				placeholder="City"
				bind:value={$values.users[index].address.city}
				name="users[{index}].address.city"
				use:highlight
				class="form-control"
			/>
			{#if $state.users[index].address.city._errors?.length}
				<div>
					{#each $state.users[index].address.city._errors as error}
						<i><small class="d-block error">* {error}</small></i>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
