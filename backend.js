// The code was written very quickly so there are a lot of things for refactoring

// imports
import {Router} from 'express'
import {
	check,
	query as checkQuery,
	body as checkBody,
	param as checkParam,
	validationResult
} from 'express-validator/check'
import {matchedData} from 'express-validator/filter'
import Validator from 'validator'

// Importing entities and utils
import {isUserAuthorizedMiddleware, hasUserPositionMiddleware} from "../middlewares"
import Person from "../db/models/Person"
import User from "../db/models/User"
import Log from "../db/models/Log"
import {hasUserPermission} from '../utils'


const router = Router()

// I like using async/await not generators. That's why all handlers wrapped with async.
// First of all I create object with two properties (middlewares, handler)
// Middlewares contains checks for user authorization, user permissions and validation.
const personCreate = {}
personCreate.middlewares = [
	isUserAuthorizedMiddleware,
	hasUserPositionMiddleware,
	checkBody('addresses').optional().isLength({min: 1}).isJSON().trim(),
	checkBody('birthDate').isISO8601(),
	checkBody('categories').optional().isLength({min: 1}).isJSON().trim(),
	checkBody('contacts').optional().isLength({min: 1}).isJSON().trim(),
	checkBody('firstName').isLength({min: 2, max: 100}).trim(),
	checkBody('gender').isLength({min: 1, max: 1}).isIn([Person.GENDER.FEMALE, Person.GENDER.MALE]).trim(),
	checkBody('lastName').optional().isLength({min: 2, max: 100}).trim(),
	checkBody('socialNumber').optional().isLength({min: 7, max: 7}).trim(),
	checkBody('surname').isLength({min: 2, max: 100}).trim(),
	checkBody('taxNumber').isLength({min: 10, max: 10}).trim()
]
personCreate.handler = async (req, res) => {
	/**
	 * @paramBody addresses {addressId: string, type: string, dateStart: string|null, dateEnd: string|null}[]
	 * @paramBody birthDate string
	 * @paramBody categories {categoryId: string, dateStart: string|null, dateEnd: string|null}[]
	 * @paramBody contacts string[]|null
	 * @paramBody firstName string
	 * @paramBody gender string
	 * @paramBody lastName string|null
	 * @paramBody socialNumber string|null
	 * @paramBody surname string
	 * @paramBody taxNumber string
	 *
	 * @returns 200 - Success
	 * @returns 400 - Invalid params
	 * @returns 403 - Forbidden
	 * @returns 404 - Person already exists
	 * @returns 500 - Server error
	 */
	try {
		const errors = validationResult(req)
		if (! errors.isEmpty()) {
			return res.status(400).json()
		}

		const filteredData = matchedData(req)
		if (! await hasUserPermission('person-create', req.session.user.model)) {
			return res.status(403).json()
		}

		if (filteredData.birthDate && filteredData.birthDate.length) {
			filteredData.birthDate = new Date(filteredData.birthDate)
		}
		const person = await Person.findOne({taxNumber: filteredData.taxNumber, surname: filteredData.surname})
		if (person) {
			return res.status(404).json()
		}

		const data = {
			surname: filteredData.surname,
			firstName: filteredData.firstName,
			lastName: filteredData.lastName || null,
			birthDate: filteredData.birthDate,
			gender: filteredData.gender,
			socialNumber: filteredData.socialNumber || null,
			taxNumber: filteredData.taxNumber
		}
		if (filteredData.addresses && filteredData.addresses.length) {
			const addresses = JSON.parse(filteredData.addresses)
			data.addresses = []
			addresses.forEach((item, ind) => {
				data.addresses.push({
					addressId: item.addressId,
					type: item.type,
					dateStart: item.dateStart ? new Date(item.dateStart) : new Date(),
					dateEnd: item.dateEnd ? new Date(item.dateEnd) : null
				})
			})
		}
		if (filteredData.categories && filteredData.categories.length) {
			const categories = JSON.parse(filteredData.categories)
			data.categories = []
			categories.forEach((item: Object, ind) => {
				data.categories.push({
					categoryId: item.categoryId,
					dateStart: item.dateStart ? new Date(item.dateStart) : new Date(),
					dateEnd: item.dateEnd ? new Date(item.dateEnd) : null
				})
			})
		}
		if (filteredData.contacts && filteredData.contacts.length) {
			data.contacts = JSON.parse(filteredData.contacts)
		}

		const authorizedUser: User = req.session.user.model
		const newPerson = new Person(data)
		await newPerson.save()
		const log = new Log({
			action: 'create',
			userId: authorizedUser.id,
			positionId: authorizedUser.positionId,
			object: 'Person',
			objectId: newPerson.id,
			data: data
		})
		await log.save()
		res.json()
	}
	catch (err) {
		console.log(err)
		res.status(500).json()
	}
}

const personList = {}
personList.middlewares = [
	isUserAuthorizedMiddleware,
	hasUserPositionMiddleware,
	checkQuery('fio').optional().isLength({min: 2}).trim(),
	checkQuery('socialNumber').optional().isLength({max: 7}).trim(),
	checkQuery('taxNumber').optional().isLength({max: 10}).trim(),
	checkQuery('birthDate').optional().isISO8601().trim(),
	checkQuery('document').optional().isLength({min: 2}).trim(),
	checkQuery('addressId').optional().isMongoId().trim(),
	checkQuery('page').optional().isNumeric().toInt(),
	checkQuery('limit').optional().isNumeric().toInt()
]
personList.handler = async (req, res) => {
	/**
	 * @returns 200 - Success:
	 * {
	 *      items: Person[],
	 *      pagination: {
	 *          count: Number,
	 *          page: Number,
	 *          limit: Number
	 *      }
	 * }
	 * @returns 400 - Invalid params
	 * @returns 403 - Forbidden
	 * @returns 500 - Server error
	 */

	try {
		const errors = validationResult(req)
		if (! errors.isEmpty()) {
			return res.status(400).json()
		}

		const filteredData: Object = matchedData(req)
		if (! await hasUserPermission('person-list', req.session.user.model)) {
			return res.status(403).json()
		}

		if (! filteredData.page) {
			filteredData.page = 1
		}
		if (! filteredData.limit) {
			filteredData.limit = 20
		}

		const query = {dateEnd: null}

		if (filteredData.fio && filteredData.fio.length) {
			const fioArr = filteredData.fio.split(' ')
			if (fioArr.length === 1) {
				query.$or = [
					{surname: RegExp(`${fioArr[0]}`, 'i')},
					{firstName: RegExp(`${fioArr[0]}`, 'i')},
					{lastName: RegExp(`${fioArr[0]}`, 'i')},
				]
			}
			else if (fioArr.length === 2) {
				query.$or = [
					{surname: RegExp(`${fioArr[0]}`, 'i'), firstName: RegExp(`${fioArr[1]}`, 'i')},
					{firstName: RegExp(`${fioArr[0]}`, 'i'), surname: RegExp(`${fioArr[1]}`, 'i')},
					{firstName: RegExp(`${fioArr[0]}`, 'i'), lastName: RegExp(`${fioArr[1]}`, 'i')},
					{lastName: RegExp(`${fioArr[0]}`, 'i'), firstName: RegExp(`${fioArr[1]}`, 'i')},
					{surname: RegExp(`${fioArr[0]}`, 'i'), lastName: RegExp(`${fioArr[1]}`, 'i')},
					{lastName: RegExp(`${fioArr[0]}`, 'i'), surname: RegExp(`${fioArr[1]}`, 'i')},
				]
			}
			else if (fioArr.length >= 3) {
				query.surname = RegExp(`${fioArr[0]}`, 'i')
				query.firstName = RegExp(`${fioArr[1]}`, 'i')
				query.lastName = RegExp(`${fioArr[2]}`, 'i')
			}
		}

		if (filteredData.socialNumber && filteredData.socialNumber.length) {
			query.socialNumber = RegExp(`${filteredData.socialNumber}`, 'i')
		}

		if (filteredData.taxNumber && filteredData.taxNumber.length) {
			query.taxNumber = RegExp(`${filteredData.taxNumber}`, 'i')
		}

		if (filteredData.birthDate) {
			const startDate = new Date(filteredData.birthDate)
			startDate.setUTCHours(0)
			const endDate = new Date(startDate)
			endDate.setUTCDate(endDate.getUTCDate() + 1)
			query.birthDate = {$gte: startDate, $lt: endDate}
		}

		if (filteredData.document && filteredData.document.length) {
			query.documentsData = RegExp(`${filteredData.document}`, 'i')
		}

		if (filteredData.addressId) {
			query.addresses = {
				$elemMatch: {addressId: filteredData.addressId}
			}
		}

		const offset = (filteredData.page - 1) * filteredData.limit
		const count = await Person.count(query)
		const items = await Person.find(query)
			.limit(filteredData.limit)
			.skip(count > offset ? offset : 0)

		const result = {
			items: [],
			pagination: {
				count: count,
				page: count > offset ? filteredData.page : 1,
				limit: filteredData.limit
			}
		}

		for (let item of items) {
			const tempResult = await item.getObject()
			result.items.push(tempResult)
		}

		res.json(result)
	}
	catch (err) {
		console.error(err.message)
		res.status(500).json()
	}
}


// Define routes with middlewares and handlers
router.post('/create', personCreate.middlewares, personCreate.handler)
router.get('/list', personList.middlewares, personList.handler)


export default router



// Mongoose model example
import mongoose, {Model, Schema} from 'mongoose';

import Address from "./address/Address";
import Category from "./Category";
import Document from './Document';
import Case from "./Case";


class Person extends Model
{
	static ADDRESS_TYPE = {
		legal: 'legal',
		living: 'living'
	};

	static GENDER = {
		MALE: 'ч',
		FEMALE: 'ж'
	};

	cases: Case[] = [];
	documents: Document[] = [];

	async fetchCases() {
		try {
			this.cases = await Case.find({personId: this.id});
			await Promise.all(
				this.cases.map(async(item, ind) => await Promise.all([
					item.fetchOrganization(),
					item.fetchStatus()
				]))
			);
		}
		catch (e) {
			console.error(e.message);
		}
	}

	async fetchDocuments() {
		try {
			this.documents = await Document.find({isForPerson: true, personId: this.id});
			await Promise.all(this.documents.map((item, ind) => item.fetchType()));
		}
		catch (e) {
			console.error(e.message);
		}
	}

	async getObject(): Promise<any> {
		const result = {
			id: this.id,
			surname: this.surname,
			firstName: this.firstName,
			lastName: this.lastName,
			addresses: [],
			contacts: [],
			documents: [],
			birthDate: this.birthDate,
			categories: [],
			cases: [],
			dateStart: this.dateStart,
			dateEnd: this.dateEnd,
			gender: this.gender,
			socialNumber: this.socialNumber,
			taxNumber: this.taxNumber
		};

		for (let item of this.addresses) {
			const address = await Address.findOne({_id: item.addressId});
			result.addresses.push({
				address: await address.getObject(),
				addressId: item.addressId,
				id: item.id,
				dateEnd: item.dateEnd,
				dateStart: item.dateStart,
				type: item.type
			});
		}

		for (let item of this.categories) {
			const category = await Category.findOne({_id: item.categoryId});
			result.categories.push({
				id: item.id,
				category: category.getObject(),
				categoryId: item.categoryId,
				dateStart: item.dateStart,
				dateEnd: item.dateEnd
			});
		}

		for (let item of this.contacts) result.contacts.push(item);
		for (let item of this.documents) result.documents.push(item.getObject());
		for (let item of this.cases) result.cases.push(await item.getObject());

		return result;
	}
}

const schema = new Schema({
	addresses: {
		type: [{
			addressId: {
				type: Schema.ObjectId,
				required: true
			},

			dateEnd: {
				type: Date,
				default: null
			},

			dateStart: {
				type: Date,
				default: Date.now()
			},

			type: {
				type: String,
				required: true
			}
		}],
		default: []
	},

	birthDate: {
		type: Date,
		required: true
	},

	categories: {
		type: [{
			categoryId: {
				type: Schema.ObjectId,
				required: true
			},

			dateStart: {
				type: Date,
				default: Date.now()
			},

			dateEnd: {
				type: Date,
				default: null
			},

			endReasonId: {
				type: Schema.ObjectId,
				default: null
			}
		}],
		default: []
	},

	contacts: {
		type: [String],
		default: []
	},

	comment: {
		type: String,
		default: null
	},

	dateEnd: {
		type: Date,
		default: null
	},

	dateStart: {
		type: Date,
		default: Date.now()
	},

	documentsData: {
		type: [String],
		default: []
	},

	endReasonId: {
		type: Schema.ObjectId,
		default: null
	},

	gender: {
		type: String,
		maxlength: 1,
		enum: [Person.GENDER.MALE, Person.GENDER.FEMALE],
		default: Person.GENDER.MALE
	},

	socialNumber: {
		type: String,
		maxlength: 7,
		default: null
	},

	socialStatuses: {
		type: [{
			socialStatusId: {
				type: Schema.ObjectId,
				required: true
			},

			dateStart: {
				type: Date,
				default: Date.now(),
				required: true
			},

			dateEnd: {
				type: Date,
				default: null
			},

			endReasonId: {
				type: Schema.ObjectId,
				default: null
			}
		}],
		default: []

	},

	taxNumber: {
		type: String,
		maxlength: 10,
		default: null
	},

	oldId: {
		type: Number,
		default: null
	},

	surname: {
		type: String,
		minlength: 2,
		maxlength: 100,
		required: true
	},

	firstName: {
		type: String,
		minlength: 2,
		maxlength: 100,
		required: true
	},

	lastName: {
		type: String,
		minlength: 2,
		maxlength: 100,
		default: null
	}
});

schema.index(
	{surname: 1, firstName: 1, lastName: 1, taxNumber: 1, socialNumber: 1, birthDate: 1},
	{name: 'PersonSearchIndex'}
);


export default mongoose.model(Person, schema, 'persons');


// Checking user permissions
export const hasUserPermission = async (permInnerName: string, user: User, organizationId?: string): Promise<boolean> => {
	try {
		if (! user.hasPosition) return false

		const position: Structure = await Structure.findOne({_id: user.positionId})
		if (! position) return false
		await position.fetchParents()

		return await position.hasPermission(permInnerName, organizationId)
	}
	catch (err) {
		console.error(err)
		return false
	}
}
