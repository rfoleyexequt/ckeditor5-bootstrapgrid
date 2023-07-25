/* Icon Registration */
import ckeditor from './../theme/icons/ckeditor.svg';
import bootstrapgridicon from './../theme/icons/bootstrapgrid.svg';
import bootstrapgridrowinserticon from './../theme/icons/bootstrapgrid-row-insert.svg';
import bootstrapgridrowdeleteicon from './../theme/icons/bootstrapgrid-row-delete.svg';
import bootstrapgridcolumninserticon from './../theme/icons/bootstrapgrid-column-insert.svg';
import bootstrapgridcolumnediticon from './../theme/icons/bootstrapgrid-column-edit.svg';
import bootstrapgridcolumndeleteicon from './../theme/icons/bootstrapgrid-column-delete.svg';

/** 
* @module bootstrapgrid
*/

export { default as Bootstrapgrid } from './bootstrapgrid';
export { default as BootstrapgridEditing } from './bootstrapgridediting';
export { default as BootstrapgridUI } from './bootstrapgridui';
export { default as BootstrapgridUtils } from './bootstrapgridutils';
export { default as BootstrapgridColumnProperties } from './bootstrapgridcolumnproperties';
export { default as BootstrapgridColumnPropertiesEditing } from './bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesediting';
export { default as BootstrapgridColumnPropertiesUI } from './bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesui';

export type { BootstrapgridConfig } from './bootstrapgridconfig';
//export type { default as BootstrapgridColumnPropertyCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumnpropertycommand';
export type { default as BootstrapgridColumnColCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncolcommand';
export type { default as BootstrapgridColumnColLGCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncollgcommand';
export type { default as BootstrapgridColumnColMDCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncolmdcommand';
export type { default as BootstrapgridColumnColSMCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncolsmcommand';
export type { default as BootstrapgridColumnColXLCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncolxlcommand';
export type { default as BootstrapgridColumnColXXLCommand } from './bootstrapgridcolumnproperties/commands/bootstrapgridcolumncolxxlcommand';

import './augmentation';

export const icons = {
	ckeditor,
        bootstrapgridicon,
        bootstrapgridrowinserticon,
        bootstrapgridrowdeleteicon,
        bootstrapgridcolumninserticon,
        bootstrapgridcolumnediticon,
        bootstrapgridcolumndeleteicon
};
