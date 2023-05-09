import { createApp } from 'vue'
import App from './App.vue'
import { VaButton, VaCheckbox, VaDataTable, VaForm, VaIcon, VaInput, VaModal, VaPopover } from 'vuestic-ui'
import 'vuestic-ui/dist/vuestic-ui.css'
import i18n from '../../i18n'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
    faPen,
    faTrash,
    faDownload,
    faListCheck,
    faCircleExclamation,
    faSpinner,
    faCheck,
    faCircleQuestion,
    faEye,
    faFolderOpen,
    faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { faCircle, faCircleCheck } from '@fortawesome/free-regular-svg-icons'

library.add(
    faPen,
    faTrash,
    faDownload,
    faListCheck,
    faCircle,
    faCircleExclamation,
    faSpinner,
    faCheck,
    faCircleQuestion,
    faEye,
    faFolderOpen,
    faPlus,
    faCircleCheck,
)

createApp(App)
    .component('va-button', VaButton)
    .component('va-checkbox', VaCheckbox)
    .component('va-data-table', VaDataTable)
    .component('va-form', VaForm)
    .component('va-icon', VaIcon)
    .component('va-input', VaInput)
    .component('va-modal', VaModal)
    .component('va-popover', VaPopover)
    .component('font-awesome-icon', FontAwesomeIcon)
    .use(i18n)
    .mount('#app')
