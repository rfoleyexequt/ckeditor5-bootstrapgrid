import type {
    // Config
    BootstrapgridConfig,

    // Plugins
    Bootstrapgrid,
    BootstrapgridEditing,
    BootstrapgridUI,
    BootstrapgridColumnProperties,
    BootstrapgridColumnPropertiesEditing,
    BootstrapgridColumnPropertiesUI,
    BootstrapgridUtils,

    // Commands
    //BootstrapgridColumnPropertyCommand,
    BootstrapgridColumnColCommand,
    BootstrapgridColumnColLGCommand,
    BootstrapgridColumnColMDCommand,
    BootstrapgridColumnColSMCommand,
    BootstrapgridColumnColXLCommand,
    BootstrapgridColumnColXXLCommand,

} from './index';

declare module '@ckeditor/ckeditor5-core' {

    interface PluginsMap {
        [Bootstrapgrid.pluginName]: Bootstrapgrid;
        [BootstrapgridEditing.pluginName]: BootstrapgridEditing;
        [BootstrapgridUI.pluginName]: BootstrapgridUI;
        [BootstrapgridColumnProperties.pluginName]: BootstrapgridColumnProperties;
        [BootstrapgridColumnPropertiesEditing.pluginName]: BootstrapgridColumnPropertiesEditing;
        [BootstrapgridColumnPropertiesUI.pluginName]: BootstrapgridColumnPropertiesUI;
        [BootstrapgridUtils.pluginName]: BootstrapgridUtils;
        [BootstrapgridColumnProperties.pluginName] : BootstrapgridColumnProperties;
    }
    
    interface CommandsMap {
        //BootstrapgridColumnProperty : BootstrapgridColumnPropertyCommand;
        BootstrapgridColumnCol : BootstrapgridColumnColCommand;
        BootstrapgridColumnColLG : BootstrapgridColumnColLGCommand;
        BootstrapgridColumnColMD : BootstrapgridColumnColMDCommand;
        BootstrapgridColumnColSM : BootstrapgridColumnColSMCommand;
        BootstrapgridColumnColXL : BootstrapgridColumnColXLCommand;
        BootstrapgridColumnColXXL : BootstrapgridColumnColXXLCommand;
    }
}