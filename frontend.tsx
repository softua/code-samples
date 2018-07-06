/*
 Stack:
 - Reactjs
 - React Router
 - Mobx
 - Electron
 - Typescript
 - Material-UI
 */


// Mobx Store
import { action, computed, observable } from "mobx"
import UserApi from "../api/UserApi"
import Breadcrumb from "../common/Breadcrumb"
import TabItem from "../common/Tabs/TabItem"
import settings from "../settings"



const { app } = window.require("electron").remote


export class MainStore
{
	api: UserApi = new UserApi()
	baseTitle = settings.baseTitle

	@observable
	_breadcrumbs: Breadcrumb[] = []

	@computed
	get breadcrumbs (): Breadcrumb[] {
		if (this._breadcrumbs && this._breadcrumbs.length) {
			let items: Breadcrumb[] = []
			if (!this.isSecondaryWindow) {
				items.push(new Breadcrumb("Главная", "/"))
			}
			for (let item of this._breadcrumbs) {
				items.push(item)
			}

			return items
		}
		else {
			return []
		}
	}

	set breadcrumbs (items: Breadcrumb[]) {
		this._breadcrumbs = items
	}

	_version: string = app.getVersion()

	@observable
	caseTabValue: string = null

	@observable
	caseTabs: TabItem[] = [
		new TabItem("Список", "/case/list", "list")
	]

	@observable
	categoryTabs: TabItem[] = [
		new TabItem("Список", "/category/list", "list"),
		new TabItem("Создать", "/category/create", "add")
	]

	@observable
	categoryTabValue: string = this.categoryTabs[ 0 ].value

	@observable
	counter: number = 0

	@observable
	geographyTabs: TabItem[] = [
		new TabItem("Адреса", "/geography/addresses", "list", "/geography/addresses"),
		new TabItem("Улицы", "/geography/streets", "list", "/geography/streets"),
		new TabItem("Типы улиц", "2", "list", "/"),
		new TabItem("Районы", "3", "list", "/"),
		new TabItem("Населеные пункты", "4", "list", "/"),
		new TabItem("Типы населеных пунктов", "5", "list", "/"),
		new TabItem("Страны", "/geography/countries", "list", "/geography/countries")
	]

	@observable
	geographyTabValue: string = this.geographyTabs[ 0 ].value

	@observable
	_title: string = ""

	@observable
	leftMenuOpened: boolean = true

	@observable
	rightMenuOpened: boolean = false

	@observable
	isMainContentVisible: boolean = true

	@observable
	isPdfView: boolean = false

	@observable
	isSecondaryWindow: boolean = false

	@observable
	mainMenu: IMainMenuItem[] = [
		{
			key: "geography",
			name: "Адресный реестр",
			iconClass: "material-icons",
			iconName: "map",
			route: "/geography/addresses",
			routeMatch: "/geography"
		},
		{
			key: "users",
			name: "Пользователи",
			iconClass: "material-icons",
			iconName: "people",
			route: "/user/list",
			routeMatch: "/user"
		},
		{
			key: "referenceBook",
			name: "Справочники",
			iconClass: "material-icons",
			iconName: "list",
			route: "/reference-book/document-type/list",
			routeMatch: "/reference-book"
		},
		{
			key: "persons",
			name: "Реестр граждан",
			iconClass: "material-icons",
			iconName: "people_outline",
			route: "/person/list",
			routeMatch: "/person"
		},
		{
			key: "cases",
			name: "Реестр обращений",
			iconClass: "material-icons",
			iconName: "card_travel",
			route: "/case/list",
			routeMatch: "/case"
		},
		{
			key: "categories",
			name: "Реестр категорий",
			iconClass: "material-icons",
			iconName: "menu",
			route: "/category/list",
			routeMatch: "/category"
		},
		{
			key: "structure",
			name: "Структура",
			iconClass: "material-icons",
			iconName: "account_balance",
			route: "/structure/list",
			routeMatch: "/structure"
		}
	]

	@observable
	isSnackbarVisible: boolean = false

	@observable
	personTabs: TabItem[] = [
		new TabItem("Граждане", "/person/list", "list", "/person/list")
	]

	@observable
	personTabValue: string = this.personTabs[ 0 ].value

	@observable
	referenceBookTabs: TabItem[] = [
		new TabItem("Типы документов", "/reference-book/document-type/list", "list", "/reference-book/document-type/list"),
		new TabItem("Услуги", "/reference-book/service/list", "list", "/reference-book/service/list"),
		new TabItem("Бланки заявлений", "/reference-book/application-blank/list", "attach_file", "/reference-book/application-blank/list")
	]

	@observable
	referenceBookTabValue: string = this.referenceBookTabs[ 0 ].value

	@observable
	showApp: boolean = false

	@observable
	snackbarMessage: string = ""

	@observable
	snackbarTimeout: number = 4000

	@observable
	currentLink: string = ""

	@observable
	urlModalDialogIsOpen: boolean = false

	@observable
	urlModalDialogLink: string = ""

	@observable
	urlModalDialogValidation: boolean = true

	@observable
	urlModalDialogValidationError: string = ""

	@action
	toggleUrlModalDialog (isOpen: boolean) {
		this.urlModalDialogIsOpen = isOpen

		if (!isOpen) {
			this.urlModalDialogLink = ""
			this.urlModalDialogValidationError = ""
			this.urlModalDialogValidation = true
		}
	}

	@action
	setValidationError (text: string) {
		this.urlModalDialogValidationError = text
		this.urlModalDialogValidation = false
	}

	@action
	setValidationSuccess () {
		this.urlModalDialogValidationError = ""
		this.urlModalDialogValidation = true
	}

	@action
	hideMainContainer () {
		this.isMainContentVisible = false
	}

	@action
	showMainContainer () {
		this.isMainContentVisible = true
	}

	@action
	showSnackbar (message: string, timeout: number = 4000) {
		this.snackbarMessage = message
		this.snackbarTimeout = timeout
		this.isSnackbarVisible = true
	}

	get title (): string {
		if (this._title && this._title.length) {
			return `${this._title} | ${this.baseTitle}`
		}
		else {
			return this.baseTitle
		}
	}

	set title (value: string) {
		this._title = value
	}

	get version (): string {
		return `v.${this._version}`
	}
}


export interface IMainMenuItem
{
	key: string
	name: string
	iconClass: string
	iconName: string
	route: string
	routeMatch: string
}


const mainStore = new MainStore()
export default mainStore


// React Component
import { History } from "history"
import Card from "material-ui/Card"
import RaisedButton from "material-ui/RaisedButton"
import TextField from "material-ui/TextField"
import FontIcon from "material-ui/FontIcon"
import SelectField from "material-ui/SelectField"
import MenuItem from "material-ui/MenuItem"
import { inject, observer } from "mobx-react"
import * as React from "react"
import * as Validator from "validator"
import * as queryString from "query-string"
import Breadcrumb from "../../common/Breadcrumb"
import Case from "../../common/Case"
import Progress from "../../components/Progress"
import TabPanel from "../../components/TabPanel"
import Paginator from "../../components/Paginator"
import DateTimePicker from "../../components/DateTimePicker"
import { AuthStore } from "../../stores/AuthStore"
import { MainStore } from "../../stores/MainStore"
import { loginUnauthorizedUser } from "../../utils/permissionsHelper"
import BasePage from "../BasePage"
import { CaseListStore } from "./store"
import "./style.scss"
import moment



	= require("moment")
import CaseStatus from "../../common/CaseStatus"
import Structure from "../../common/Structure"



declare function setTimeout (handler: () => any, ms: number): number


@inject("authStore", "caseListStore", "mainStore")
@observer
class CaseList extends React.Component<IProps, {}>
{
	constructor (props) {
		super(props)
	}

	async componentDidMount () {
		const { authStore, mainStore, history } = this.props

		await BasePage.INIT(authStore, mainStore, history)
		loginUnauthorizedUser(authStore, history)

		this.reinit(this.props)
	}

	async componentWillReceiveProps (nextProps) {
		await this.reinit(nextProps)
	}

	componentWillUnmount () {
		const { caseListStore } = this.props

		caseListStore.reset()
	}

	reinit = async (props: IProps) => {
		const { caseListStore, mainStore, history } = props
		const urlParams = new URLSearchParams(history.location.search)

		caseListStore.reset()

		if (urlParams.has("limit") && Validator.isNumeric(urlParams.get("limit"))) {
			caseListStore.paginationLimit = parseInt(urlParams.get("limit"))
		}

		if (urlParams.has("page") && Validator.isNumeric(urlParams.get("page"))) {
			caseListStore.paginationPage = parseInt(urlParams.get("page"))
		}

		const query = queryString.stringify({
			page: caseListStore.paginationPage,
			limit: caseListStore.paginationLimit
		})

		mainStore.caseTabValue = mainStore.caseTabs[ 0 ].value as string
		mainStore.title = "Реєстр звернень громадян"
		document.title = mainStore.title
		mainStore.breadcrumbs = [
			new Breadcrumb("Реєстр звернень", `/case/list?${query}`)
		]

		this.getCasesList()
	}

	getCasesList = async (): Promise<any> => {
		const { caseListStore, mainStore } = this.props
		const responseStatus = await caseListStore.fetchItems()

		if (responseStatus === 400) {
			mainStore.showSnackbar("Невірно вказані параметри. Перевірте та спробуйте ще")
		}
		else if (responseStatus === 403) {
			mainStore.showSnackbar("Доступ заблоковано. Зверніться до адміністратора")
		}
		else if (responseStatus === 500) {
			mainStore.showSnackbar("Виникла помилка на сервері. Спробуйте пізніше")
		}
		else if (responseStatus !== 200 && responseStatus !== 304) {
			mainStore.showSnackbar("Виникла внутрішня помилка. Зверніться до адміністратора")
		}
	}

	setResolutionBackground = (date: Date) => {
		const controlDateTimestamp = new Date(date).getTime()
		const nowTimestamp = new Date().getTime()
		const oneDayMs = 1000 * 60 * 60 * 24

		if (controlDateTimestamp <= nowTimestamp) {
			return "bg-light-red warning"
		} else if (controlDateTimestamp <= (nowTimestamp + oneDayMs)) {
			return "bg-light-red"
		} else if (controlDateTimestamp <= (nowTimestamp + (oneDayMs * 3))) {
			return "bg-light-yellow"
		} else {
			return ""
		}
	}

	handleAddingButton = async (): Promise<any> => {
		const { history } = this.props

		history.push("/case/create")
	}

	handleCardButtonClick = async (event: any, item: Case): Promise<any> => {
		const { history } = this.props

		setTimeout(() => {
			history.push(`/case/card/${item.id}`)
		}, 200)
	}

	handleTabsChange = (value: string) => {
		const { history, mainStore } = this.props

		mainStore.caseTabValue = value
		history.push(value)
	}

	handlePaginatorPageChange = (event, index, value) => {
		const { history, mainStore, caseListStore } = this.props

		caseListStore.paginationPage = value

		const listLink = "/case/list"
		const query = queryString.stringify({
			page: caseListStore.paginationPage,
			limit: caseListStore.paginationLimit
		})
		const link = `${listLink}?${query}`

		mainStore.caseTabs[ 0 ].value = link

		history.push(link)
	}

	handlePaginatorPerPageChange = (event, index, value) => {
		const { history, mainStore, caseListStore } = this.props

		caseListStore.paginationPage = 1
		caseListStore.paginationLimit = value

		const listLink = "/case/list"
		const query = queryString.stringify({
			page: caseListStore.paginationPage,
			limit: caseListStore.paginationLimit
		})
		const link = `${listLink}?${query}`

		mainStore.caseTabs[ 0 ].value = link

		history.push(link)
	}

	handleChangeFilterFullName = (event: Object, text: string) => {
		const { caseListStore } = this.props

		caseListStore.filterFullName = text
	}

	handleChangeFilterFullNumber = (event: Object, text: string) => {
		const { caseListStore } = this.props

		caseListStore.filterNumber = text
	}

	handleChangeFilterDateFrom = (date: Date) => {
		const { caseListStore } = this.props
		console.log(date)
		caseListStore.filterDateFrom = date
	}

	handleChangeFilterDateTo = (date: Date) => {
		const { caseListStore } = this.props

		caseListStore.filterDateTo = date
	}

	handleResetFilter = async (): Promise<any> => {
		const { caseListStore } = this.props

		caseListStore.resetFilter()

		this.getCasesList()
	}

	handleFilterStatusChange = async (event: any, key: number, id: string): Promise<any> => {
		const { caseListStore } = this.props

		caseListStore.filterSelectedStatus = caseListStore.availableStatuses.find(item => item.id === id)
	}

	handleFilterOrganizationChange = async (event: any, key: number, id: string): Promise<any> => {
		const { caseListStore } = this.props

		caseListStore.filterSelectedOrganization = caseListStore.availableOrganizations.find(item => item.id === id)
	}

	renderCaseList = () => {
		const { caseListStore } = this.props

		const cardContainerStyle: React.CSSProperties = {
			padding: 20
		}
		const flexContainerStyle: React.CSSProperties = {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			padding: "5px 0"
		}
		const firstFlexItemStyle: React.CSSProperties = {
			flex: 1,
			textAlign: "left",
			padding: "0 5px 0 0"
		}
		const lastFlexItemStyle: React.CSSProperties = {
			flex: 1,
			textAlign: "right",
			padding: "0 0 0 5px"
		}
		const centerFlexItemStyle: React.CSSProperties = {
			flex: 1,
			textAlign: "center",
			padding: "0 5px"
		}
		return ([
			caseListStore.items.map((item: Case, index: number) => (
				<Card
					key={ index }
					style={ {
						...cardContainerStyle,
						marginTop: 20,
						opacity: item.closed ? 0.6 : 1
					} }
					className={ `case-card ${item.status && item.status.name === "Закрито"
						? "" : this.setResolutionBackground(item.control)}` }
				>
					<div style={ flexContainerStyle }>
						<div style={ firstFlexItemStyle }>
							<span className='card-title'>Організація</span>
							<span className='card-subtitle'>{ item.organization.fullNameShort }</span>
						</div>
						<div style={ lastFlexItemStyle }>
							<div style={ { display: "flex", justifyContent: "flex-end" } }>
								<div className="warning-icon" style={ { padding: 8 } }>
									<FontIcon className="material-icons">warning</FontIcon>
								</div>
								<div>
									<span className='card-title'>Контроль</span>
									<span className='card-subtitle'>
			{ moment(item.control).format("DD.MM.YYYY HH:mm") }
	</span>
								</div>
							</div>
						</div>
					</div>
					<div style={ flexContainerStyle }>
						<div style={ firstFlexItemStyle }>
							{
								item.person && (
									<div>
										<span className='card-title'>Заявник</span>
										<span className='card-subtitle'>
			{
				(`${item.person.fullName}, ${moment(item.person.birthDate).format("DD.MM.YYYY")} р. нар. ${item.person.taxNumber ? `ІПН: ${item.person.taxNumber}` : ""}`)
			}
	</span>
									</div>
								)
							}
						</div>

						<div style={ lastFlexItemStyle }>
							<span className='card-title'>Час реєстрації</span>
							<span
								className='card-subtitle'>{ moment(item.date).format("DD.MM.YYYY HH:mm") }</span>
						</div>
					</div>

					<div style={ flexContainerStyle }>
						<div style={ firstFlexItemStyle }>
							{
								item.result && (
									<div>
										<span className='card-title'>Результат прийому</span>
										<span className='card-subtitle'>{ item.result.shortName }</span>
									</div>
								)
							}
						</div>

						<div style={ centerFlexItemStyle }>
							{
								item.closed && (
									<div>
										<span className='card-title'>Дата зачинення</span>
										<span
											className='card-subtitle'>{ moment(item.closed).format("DD.MM.YYYY HH:mm") }</span>
									</div>
								)
							}
						</div>

						<div style={ lastFlexItemStyle }>
							<span className='card-title'>Стан</span>
							<span className='card-subtitle'>{ item.status.name }</span>
						</div>
					</div>


					<div style={ flexContainerStyle }>
						<div style={ firstFlexItemStyle }>
							<span className='card-title'>Номер</span>
							<span className='card-subtitle'>{ item.fullNumber }</span>
						</div>

						<div style={ { ...lastFlexItemStyle, flex: 3 } }>
							<RaisedButton label='Переглянути'
							              primary={ true }
							              fullWidth={ true }
							              onTouchTap={ event => this.handleCardButtonClick(event, item) }
							/>
						</div>
					</div>
				</Card>
			)),
			<Paginator
				key={ -1 }
				count={ caseListStore.paginationCount }
				perPage={ caseListStore.paginationLimit }
				page={ caseListStore.paginationPage }
				pageCallback={ this.handlePaginatorPageChange }
				perPageCallback={ this.handlePaginatorPerPageChange }
			/>
		])
	}

	renderFilter = () => {
		const { caseListStore } = this.props
		const flexContainer = {
			display: "flex"
		}

		const flexLeft = {
			display: "flex",
			flex: 1
		}

		const flexRight = {
			display: "flex",
			flex: 1
		}

		const buttonStyles = {
			marginTop: "10px"
		}

		return (
			<fieldset className="filter-container">
				<legend>Фiльтр</legend>

				<div style={ flexContainer }>
					<TextField
						value={ caseListStore.filterFullName }
						floatingLabelText="ПIБ"
						fullWidth={ true }
						onChange={ this.handleChangeFilterFullName }
					/>
				</div>
				<div style={ flexContainer }>
					<SelectField
						floatingLabelText="Органiзацiя"
						style={ { textAlign: "left" } }
						fullWidth={ true }
						value={
							caseListStore.filterSelectedOrganization ?
								caseListStore.filterSelectedOrganization.id : null
						}
						onChange={ this.handleFilterOrganizationChange }
					>
						{
							caseListStore.availableOrganizations.map((item: Structure, index: number) => (
								<MenuItem
									key={ index }
									primaryText={ item.name }
									value={ item.id }
								/>
							))
						}
					</SelectField>
				</div>
				<div style={ flexContainer }>
					<SelectField
						floatingLabelText="Стан"
						style={ { textAlign: "left" } }
						fullWidth={ true }
						value={
							caseListStore.filterSelectedStatus ?
								caseListStore.filterSelectedStatus.id : null
						}
						onChange={ this.handleFilterStatusChange }
					>
						{
							caseListStore.availableStatuses.map((item: CaseStatus, index: number) => (
								<MenuItem
									key={ index }
									primaryText={ item.name }
									value={ item.id }
								/>
							))
						}
					</SelectField>
				</div>
				<div style={ flexContainer }>
					<TextField
						value={ caseListStore.filterNumber }
						floatingLabelText="Номер"
						fullWidth={ true }
						onChange={ this.handleChangeFilterFullNumber }
					/>
				</div>
				<div style={ flexContainer }>
					<div style={ { ...flexLeft, paddingRight: 5 } }>
						<DateTimePicker
							className="from-date-picker"
							date={ caseListStore.filterDateFrom }
							label="Дата початку"
							showPlaceholder={ true }
							datePlaceholder="ДД.MM.РРРР"
							dateFormat="DD.MM.YYYY"
							onChange={ date => this.handleChangeFilterDateFrom(date) }
							enableTime={ false }
						/>
					</div>
					<div style={ { ...flexRight, paddingLeft: 5 } }>
						<DateTimePicker
							className="to-date-picker"
							date={ caseListStore.filterDateTo }
							minDate={ caseListStore.filterDateFrom }
							label="Дата кінця"
							showPlaceholder={ true }
							datePlaceholder="ДД.MM.РРРР"
							dateFormat="DD.MM.YYYY"
							onChange={ date => this.handleChangeFilterDateTo(date) }
							enableTime={ false }
						/>
					</div>
				</div>

				<RaisedButton
					primary
					style={ buttonStyles }
					fullWidth={ true }
					label="Відфільтрувати"
					onTouchTap={ this.getCasesList }
				/>

				<RaisedButton
					secondary
					style={ buttonStyles }
					fullWidth={ true }
					label="Сброс"
					onTouchTap={ () => this.handleResetFilter() }
				/>

			</fieldset>
		)
	}

	render () {
		const { caseListStore, mainStore } = this.props

		const addButtonStyles: any = {
			margin: "20px 0 0 0"
		}

		return (
			<div className='case-list'>
				<TabPanel items={ mainStore.caseTabs }
				          value={ mainStore.caseTabValue as string }
				          changeCb={ this.handleTabsChange }
				/>
				{
					(caseListStore.loadings <= 0) && (
						<RaisedButton primary={ true }
						              fullWidth={ true }
						              label="Додати запис"
						              style={ addButtonStyles }
						              onTouchTap={ this.handleAddingButton }
						/>
					)
				}

				{
					(caseListStore.loadings > 0) && (
						<Progress isRendering={ true }/>
					) || (
						<div>
							{ this.renderFilter() }

							{
								(!caseListStore.items.length) && (
									<p>Нічого не знайдено</p>
								) || (
									this.renderCaseList()
								)
							}
						</div>
					)
				}
			</div>
		)
	}
}


interface IProps
{
	authStore?: AuthStore
	caseListStore?: CaseListStore
	history?: History
	mainStore?: MainStore
}


export default CaseList