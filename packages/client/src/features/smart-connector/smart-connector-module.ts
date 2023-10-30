import { FeatureModule, TYPES, bindAsService, configureActionHandler, OpenSmartConnectorAction, CloseSmartConnectorAction, MoveAction, SetBoundsAction, SetViewportAction, DeleteElementOperation } from '~glsp-sprotty';
import '../../../css/smart-connector.css'
import { SmartConnector } from './smart-connector';

export const smartConnectorModule = new FeatureModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bindAsService(context, TYPES.IUIExtension, SmartConnector);
    bind(TYPES.IDiagramStartup).toService(SmartConnector);
    configureActionHandler(context, OpenSmartConnectorAction.KIND, SmartConnector);
    configureActionHandler(context, CloseSmartConnectorAction.KIND, SmartConnector);
    configureActionHandler(context, MoveAction.KIND, SmartConnector);
    configureActionHandler(context, SetBoundsAction.KIND, SmartConnector);
    configureActionHandler(context, SetViewportAction.KIND, SmartConnector);
    configureActionHandler(context, DeleteElementOperation.KIND, SmartConnector);
});