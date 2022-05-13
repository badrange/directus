import { Accountability, PrimaryKey } from '@directus/shared/types';
import { defineOperationApi, toArray } from '@directus/shared/utils';
import { ItemsService } from '../../services';
import { Item } from '../../types';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';

type Options = {
	mode: 'one' | 'many' | 'query';
	collection: string;
	key: PrimaryKey | PrimaryKey[] | null;
	query: string;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'read',

	handler: async ({ mode, collection, key, query, permissions }, { accountability, database, getSchema }) => {
		const schema = await getSchema({ database });

		let customAccountability: Accountability | null;

		if (!permissions || permissions === '$trigger') {
			customAccountability = accountability;
		} else if (permissions === '$full') {
			customAccountability = null;
		} else if (permissions === '$public') {
			customAccountability = await getAccountabilityForRole(null, { database, schema, accountability });
		} else {
			customAccountability = await getAccountabilityForRole(permissions, { database, schema, accountability });
		}

		const itemsService = new ItemsService(collection, {
			schema,
			accountability: customAccountability,
			knex: database,
		});

		let result: Item | Item[] | null;

		if (mode === 'one') {
			if (!key) result = null;
			else result = await itemsService.readOne(toArray(key)[0], query ? JSON.parse(query) : {});
		} else if (mode === 'many') {
			if (!key) result = null;
			else result = await itemsService.readMany(toArray(key) as PrimaryKey[], query ? JSON.parse(query) : {});
		} else {
			result = await itemsService.readByQuery(query ? JSON.parse(query) : {});
		}

		return result;
	},
});