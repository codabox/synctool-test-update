<template>
    <main class="main-layout">
        <div>
            <header class="main-header">
                <img alt="codabox logo" class="main-logo" src="../assets/logo.svg">
                <div class="actions">
                    <va-button @click="openModalToAddConnection()">
                        <font-awesome-icon class="addButton" icon="fa-solid fa-plus" />
                        {{ $t("addConnection") }}
                    </va-button>
                </div>
            </header>
            <va-data-table :items="info" :columns="columns" :no-data-html="$t('connectionsEmpty')" striped>
                <template #cell(Status)="{ rowIndex }">
                    <va-popover
                        v-if="info[rowIndex].LastConnectionFailed && info[rowIndex].LastConnectionError !== 'new'"
                        color="gray"
                        :message="$t(errorMessage(rowIndex))"
                        :hover-over-timeout="hoverTimeout"
                    >
                        <va-icon :color="statusColor(rowIndex)">
                            <font-awesome-icon
                                :icon="statusIcon(rowIndex)"
                            />
                        </va-icon>
                    </va-popover>
                    <va-icon v-else :color="statusColor(rowIndex)">
                        <font-awesome-icon
                            :icon="statusIcon(rowIndex)"
                        />
                    </va-icon>
                </template>
                <template #cell(actions)="{ rowIndex }">
                    <va-popover color="gray" :message="$t('editConnection')" :hover-over-timeout="hoverTimeout">
                        <va-button flat @click="openModalToEditConnectionById(rowIndex)">
                            <font-awesome-icon
                                icon="fa-solid fa-pen"
                            />
                        </va-button>
                    </va-popover>
                    <va-popover color="gray" :message="$t('delete')" :hover-over-timeout="hoverTimeout">
                        <va-button flat @click="openModalToDeleteConnectionById(rowIndex)">
                            <font-awesome-icon
                                icon="fa-solid fa-trash"
                            />
                        </va-button>
                    </va-popover>
                    <va-popover color="gray" :message="$t('download')" :hover-over-timeout="hoverTimeout">
                        <va-button
                            flat
                            :loading="downloadSpinner(rowIndex)"
                            :disabled="canTestConnection(rowIndex)"
                            @click="downloadForConnection(rowIndex)"
                        >
                            <va-icon :color="downloadColor(rowIndex)" size="small">
                                <font-awesome-icon
                                    :icon="downloadIcon(rowIndex)"
                                />
                            </va-icon>
                        </va-button>
                    </va-popover>
                    <va-popover color="gray" :message="$t('testConnection')" :hover-over-timeout="hoverTimeout">
                        <va-button
                            flat
                            :loading="testConnectionSpinner(rowIndex)"
                            :disabled="canTestConnection(rowIndex)"
                            @click="testConnection(rowIndex)"
                        >
                            <va-icon :color="testConnectionColor(rowIndex)" size="small">
                                <font-awesome-icon
                                    :icon="testConnectionIcon(rowIndex)"
                                />
                            </va-icon>
                        </va-button>
                    </va-popover>
                    <va-popover color="gray" :message="$t('openDownloadFolder')" :hover-over-timeout="hoverTimeout">
                        <va-button flat @click="openFolder(rowIndex)">
                            <font-awesome-icon icon="fa-solid fa-folder-open" />
                        </va-button>
                    </va-popover>
                </template>
            </va-data-table>

            <va-modal
                :model-value="!!newConnection"
                :message="$t('addConnection')"
                :ok-text="$t('confirm')"
                :cancel-text="$t('cancel')"
                @ok="addConnection()"
                @cancel="resetNewConnection()"
            >
                <slot>
                    <va-form
                        ref="form"
                        tag="form"
                        autofocus
                        @validation="validation = $event"
                        @submit.prevent="addConnection()"
                    >
                        <va-input
                            key="ConnectionName"
                            v-model="newConnection['ConnectionName']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['ConnectionName'])"
                        />
                        <va-input
                            key="Username"
                            v-model="newConnection['Username']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['Username'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                        />
                        <va-input
                            key="Password"
                            v-model="newConnection['Password']"
                            class="my-3"
                            :type="passwordFieldType"
                            :label="$t(formLabels['Password'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                        >
                            <template #appendInner>
                                <font-awesome-icon icon="fa-solid fa-eye" @click="togglePasswordVisibility()" />
                            </template>
                        </va-input>
                        <va-input
                            key="Folder"
                            v-model="newConnection['Folder']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['Folder'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                            readonly
                            @click="browse()"
                        >
                            <template #appendInner>
                                <font-awesome-icon icon="fa-solid fa-folder-open" />
                            </template>
                        </va-input>
                        <va-button type="submit" hidden @click="addConnection()" />
                    </va-form>
                </slot>
            </va-modal>
            <va-modal
                :model-value="!!editedConnection"
                :message="$t('editConnection')"
                :cancel-text="$t('cancel')"
                :ok-text="$t('confirm')"
                @ok="editConnection()"
                @cancel="resetEditedConnection()"
            >
                <slot>
                    <va-form
                        ref="form"
                        tag="form"
                        autofocus
                        @validation="validation = $event"
                        @submit.prevent="addConnection()"
                    >
                        <va-input
                            key="ConnectionName"
                            v-model="editedConnection['ConnectionName']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['ConnectionName'])"
                        />
                        <va-input
                            key="Username"
                            v-model="editedConnection['Username']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['Username'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                        />
                        <va-input
                            key="Password"
                            v-model="editedConnection['Password']"
                            class="my-3"
                            :type="passwordFieldType"
                            :label="$t(formLabels['Password'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                        >
                            <template #appendInner>
                                <font-awesome-icon icon="fa-solid fa-eye" @click="togglePasswordVisibility()" />
                            </template>
                        </va-input>
                        <va-input
                            key="Folder"
                            v-model="editedConnection['Folder']"
                            class="my-3"
                            type="text"
                            :label="$t(formLabels['Folder'])"
                            :rules="[(value) => (value && value.length > 0) || $t('isRequired')]"
                            readonly
                            @click="browse()"
                        >
                            <template #appendInner>
                                <font-awesome-icon icon="fa-solid fa-folder-open" />
                            </template>
                        </va-input>
                        <va-button type="submit" hidden @click="editConnection()" />
                    </va-form>
                </slot>
            </va-modal>
            <va-modal
                :model-value="!!deletedConnection"
                :message="$t('deleteConfirmation')"
                :ok-text="$t('yes')"
                :cancel-text="$t('no')"
                @ok="deleteConnection()"
                @cancel="resetDeletedConnection()"
            />
            <va-modal
                :model-value="!!downloadedConnectionError"
                :message="downloadedConnectionError"
                hide-default-actions
            >
                <template #footer>
                    <va-button @click="resetDownloadedConnectionError()">
                        OK
                    </va-button>
                </template>
            </va-modal>
            <va-modal
                :model-value="!!testedConnectionError"
                :message="testedConnectionError"
                hide-default-actions
            >
                <template #footer>
                    <va-button @click="resetTestedConnectionError()">
                        OK
                    </va-button>
                </template>
            </va-modal>
        </div>

        <footer class="main-footer">
            <a class="faq-link" target="_blank" @click="openFaqLink()">
                <font-awesome-icon icon="fa-solid fa-circle-question" />{{ $t("manualLink") }}</a>
            <span class="main-footer-separator">-</span>
            <div class="version">
                {{ $t("version") }}: {{ version }}
            </div>
            <va-button class="ml-auto" @click="openLogs()">
                {{ $t("showLogs") }}
            </va-button>
        </footer>
    </main>
</template>

<script>
import { api } from '../electron'
import { mergeGlobalConfig } from 'vuestic-ui'
mergeGlobalConfig({
    colors: {
        info: '#0d52ff',
        primary: '#0d52ff',
    },
})
const defaultConnection = {
    ConnectionName: '',
    Username: '',
    Password: '',
    Folder: '',
}
export default {
    name: 'sync-tool',
    data () {
        return {
            info: [],
            version: this.$i18n.t('unknown'),
            deletedConnectionId: null,
            deletedConnection: null,
            downloadedConnectionId: null,
            downloadedConnectionError: null,
            downloadedConnectionStatus: null,
            downloadedConnectionTimeoutId: null,
            editedConnectionId: null,
            editedConnection: null,
            hoverTimeout: 500,
            newConnection: null,
            passwordFieldType: 'password',
            testedConnectionId: null,
            testedConnectionError: null,
            testedConnectionStatus: null,
            testedConnectionTimeoutId: null,
            validation: null,
            formLabels: {
                ConnectionName: 'connectionName',
                Username: 'username',
                Password: 'password',
                Folder: 'destinationFolder',
            },
        }
    },
    computed: {
        visibilityIcon () {
            return this.passwordFieldType === 'password' ? 'visibility' : 'visibility_off'
        },
        columns () {
            return [
                { key: 'ConnectionName', sortable: true, label: this.$i18n.t('connectionName') },
                { key: 'Username', sortable: true, label: this.$i18n.t('username') },
                { key: 'Folder', sortable: true, label: this.$i18n.t('destinationFolder') },
                { key: 'LastConnection', sortable: true, label: this.$i18n.t('lastConnectionDownload') },
                { key: 'Status', sortable: true, label: this.$i18n.t('status') },
                { key: 'actions', width: 80, label: this.$i18n.t('actions') },
            ]
        },
    },
    mounted () {
        api.receive('download-status', (downloadStatus, connection) => {
            this.downloadedConnectionStatus = downloadStatus
            if (downloadStatus.split(': ')[0] === 'FOLDER_ACCESS_ERROR') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('downloadError')}
                    ${this.$i18n.t('downloadFolderAccessError', { folder: downloadStatus.split(': ')[1] })}
                    ${this.$i18n.t('checkIT')}
                `
            } else if (connection.LastConnectionError === 'ENOTFOUND') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('downloadError')}
                    ${this.$i18n.t('serverError')}
                    ${this.$i18n.t('checkIT')}
                `
            } else if (connection.LastConnectionError === 'ERR_GENERIC_CLIENT') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('downloadError')}
                    ${this.$i18n.t('userError')}
                `
            } else if (downloadStatus !== 'OK') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('downloadError')}
                    ${this.$i18n.t('loginError')}
                    ${this.$i18n.t('checkIT')}
                `
            }
            this.downloadedConnectionTimeoutId = setTimeout(() => {
                this.downloadedConnectionId = null
                this.downloadedConnectionStatus = null
            }, 5000)
        })
        api.receive('test-connection-status', (testConnectionStatus, connection) => {
            this.testedConnectionStatus = testConnectionStatus
            if (connection.LastConnectionError === 'ENOTFOUND') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('testError')}
                    ${this.$i18n.t('serverError')}
                    ${this.$i18n.t('checkIT')}
                `
            } else if (connection.LastConnectionError === 'ERR_GENERIC_CLIENT') {
                this.downloadedConnectionError = `
                    ${this.$i18n.t('testError')}
                    ${this.$i18n.t('userError')}
                `
            } else if (testConnectionStatus !== 'OK') {
                this.testedConnectionError = `
                    ${this.$i18n.t('testError')}
                    ${this.$i18n.t('loginError')}
                    ${this.$i18n.t('checkIT')}
                `
            }
            this.testedConnectionTimeoutId = setTimeout(() => {
                this.testedConnectionId = null
                this.testedConnectionStatus = null
            }, 5000)
        })
        api.receive('folder', (folder) => {
            if (this.newConnection) {
                this.newConnection.Folder = folder
            } else if (this.editedConnection) {
                this.editedConnection.Folder = folder
            }
        })
        api.receive('user-info', (info) => {
            // Convert last connection to date
            for (const k in info) {
                if (info[k].LastConnection && info[k].LastDownload) {
                    info[k].LastConnection = this.formatLastConnection(new Date(info[k].LastConnection)) +
                    ' / ' +
                    this.formatLastConnection(new Date(info[k].LastDownload))
                } else if (info[k].LastConnection) {
                    info[k].LastConnection = this.formatLastConnection(new Date(info[k].LastConnection))
                }
            }
            this.info = info
        })
        api.receive('version', (version) => {
            this.version = version
        })
        // back-end requested we change the locale, so do this
        api.receive('locale', (locale) => {
            this.$i18n.locale = locale
        })
        // back-end request to add connection
        api.receive('add-connection', () => {
            this.openModalToAddConnection()
        })
    },
    created () {
        // Request to get the app version when starting the window
        api.send('get-version', {})
        api.send('get-user-info', {})
        // Request to get the current locale
        api.send('get-locale', {})
    },
    methods: {
        browse () {
            api.send('browse', {})
        },
        downloadSpinner (id) {
            return this.downloadedConnectionId === id && this.downloadedConnectionStatus === null
        },
        downloadColor (id) {
            if (this.downloadedConnectionId !== id) {
                return 'info'
            }
            return this.downloadedConnectionStatus === null
                ? 'info'
                : (this.downloadedConnectionStatus === 'OK'
                    ? 'success'
                    : 'danger'
                )
        },
        downloadIcon (id) {
            if (this.downloadedConnectionId !== id) {
                return 'fa-solid fa-download'
            }
            return this.downloadedConnectionStatus === null
                ? 'fa-solid fa-spinner fa-spin'
                : (this.downloadedConnectionStatus === 'OK'
                    ? 'fa-solid fa-check'
                    : 'fa-solid fa-circle-exclamation'
                )
        },
        testConnectionColor (id) {
            if (this.testedConnectionId !== id) {
                return 'info'
            }
            return this.testedConnectionStatus === null
                ? 'info'
                : (this.testedConnectionStatus === 'OK'
                    ? 'success'
                    : 'danger'
                )
        },
        testConnectionIcon (id) {
            if (this.testedConnectionId !== id) {
                return 'fa-solid fa-list-check'
            }
            return this.testedConnectionStatus === null
                ? 'fa-solid fa-spinner fa-spin'
                : (this.testedConnectionStatus === 'OK'
                    ? 'fa-solid fa-check'
                    : 'fa-solid fa-circle-exclamation'
                )
        },
        openFolder (id) {
            api.send('openDownloadFolder', this.info[id].Folder)
        },
        testConnectionSpinner (id) {
            return this.testedConnectionId === id && this.testedConnectionStatus === null
        },
        statusColor (id) {
            return this.info[id].LastConnectionFailed === undefined ||
            this.info[id].LastConnectionFailed === null ||
            this.info[id].LastConnectionError === 'new'
                ? 'info'
                : (this.info[id].LastConnectionFailed
                    ? 'danger'
                    : 'success'
                )
        },
        statusIcon (id) {
            return this.info[id].LastConnectionFailed === undefined ||
            this.info[id].LastConnectionFailed === null ||
            this.info[id].LastConnectionError === 'new'
                ? 'fa-regular fa-circle'
                : (this.info[id].LastConnectionFailed
                    ? 'fa-solid fa-circle-exclamation'
                    : 'fa-regular fa-circle-check'
                )
        },
        openModalToAddConnection () {
            this.newConnection = { ...defaultConnection }
        },
        openModalToDeleteConnectionById (id) {
            this.deletedConnectionId = id
            this.deletedConnection = {
                Username: this.info[id].Username,
                Password: this.info[id].Password,
                Folder: this.info[id].Folder,
            }
        },
        openModalToEditConnectionById (id) {
            this.editedConnectionId = id
            this.editedConnection = {
                ConnectionName: this.info[id].ConnectionName,
                Username: this.info[id].Username,
                Password: this.info[id].Password,
                Folder: this.info[id].Folder,
            }
        },
        resetDownloadedConnectionError () {
            this.downloadedConnectionError = null
        },
        resetTestedConnectionError () {
            this.testedConnectionError = null
        },
        resetDeletedConnection () {
            this.deletedConnection = null
            this.deletedConnectionId = null
        },
        resetEditedConnection () {
            this.editedConnection = null
            this.editedConnectionId = null
            this.passwordFieldType = 'password'
        },
        resetNewConnection () {
            this.newConnection = null
            this.passwordFieldType = 'password'
        },
        deleteConnection () {
            api.send('delete-connection', this.deletedConnectionId)
            this.resetDeletedConnection()
        },
        editConnection () {
            this.$refs.form.validate()
            if (this.validation === false) {
                this.$refs.form.focusInvalid()
                this.validation = null
                return
            }
            api.send(
                'save-connection',
                {
                    Index: this.editedConnectionId,
                    ConnectionName: (
                        this.editedConnection.ConnectionName && this.editedConnection.ConnectionName.trim()
                    ),
                    Username: this.editedConnection.Username.trim(),
                    Folder: this.editedConnection.Folder,
                    Password: this.editedConnection.Password.trim(),
                },
            )
            this.testConnection(this.editedConnectionId)
            this.resetEditedConnection()
        },
        downloadForConnection (id) {
            this.downloadedConnectionId = id
            this.downloadedConnectionStatus = null
            clearTimeout(this.downloadedConnectionTimeoutId)
            api.send('download-connection',
                {
                    Index: id,
                    Username: this.info[id].Username,
                    Folder: this.info[id].Folder,
                },
            )
        },
        errorMessage (id) {
            const error = this.info[id].LastConnectionError || ''
            if (this.info[id].LastConnectionError === null) {
                return 'noConnection'
            }
            return {
                ENOTFOUND: 'serverErrorShort',
                ERR_GENERIC_CLIENT: 'userErrorShort',
                '': 'unknownError',
            }[error] || 'unknownError'
        },
        canTestConnection (id) {
            return this.info[id].LastConnectionError === 'ERR_GENERIC_CLIENT'
        },
        testConnection (id) {
            this.testedConnectionId = id
            this.testedConnectionStatus = null
            clearTimeout(this.testedConnectionTimeoutId)
            api.send('test-connection',
                {
                    Index: id,
                    Username: this.info[id].Username,
                    Folder: this.info[id].Folder,
                },
            )
        },
        addConnection () {
            this.$refs.form.validate()
            if (this.validation === false) {
                this.$refs.form.focusInvalid()
                this.validation = null
                return
            }
            api.send(
                'save-connection',
                {
                    Index: -1,
                    ConnectionName: this.newConnection.ConnectionName.trim(),
                    Username: this.newConnection.Username.trim(),
                    Password: this.newConnection.Password.trim(),
                    Folder: this.newConnection.Folder,
                    LastConnection: null,
                    LastConnectionFailed: null,
                    LastConnectionError: 'new',
                },
            )
            // I do the api call here manually because the connection does not exist here yet.
            api.send('test-connection',
                {
                    Index: this.info.length,
                    Username: this.newConnection.Username.trim(),
                    Folder: this.newConnection.Password.trim(),
                },
            )
            this.resetNewConnection()
        },
        formatLastConnection (d) {
            return (
                d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
                `${d.getHours()}`.padStart(2, 0) + ':' + `${d.getMinutes()}`.padStart(2, 0) + ':' +
                `${d.getSeconds()}`.padStart(2, 0)
            )
        },
        togglePasswordVisibility () {
            this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password'
        },
        openFaqLink () {
            api.send('open-faq-link')
        },
        openLogs () {
            api.send('openLogs')
        },
    },
}
</script>

<style>
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: local('Material Icons'), url('../assets/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2') format('woff2');
}
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
.main-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.main-logo {
    width: 150px;
}
.actions {
    display: flex;
}
.main-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}
.main-footer {
    margin-top: auto;
    display: flex;
    align-items: center;
}
.version {
    color: #a7a7a7;
}
.faq-link {
    color: rgb(44, 130, 224);
    cursor: pointer;
}
.main-footer-separator {
    color: #a7a7a7;
    padding: 0 10px;
}
.addButton {
    padding-right: 10px;
}
</style>
