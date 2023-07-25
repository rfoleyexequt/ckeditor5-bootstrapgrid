/**
 * @module boottrapgrid/bootstrapgridcolumnproperties
 */

import { Plugin } from 'ckeditor5/src/core';

import BootstrapgridColumnPropertiesUI from './bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesui';
import BootstrapgridColumnPropertiesEditing from './bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesediting';

/**
 * The bootstrapgrid column properties feature. Enables support for setting properties of bootstrapgrid columns (col, col-ms, col-mg, col-lg, col-xl, col-xxl).
 *
 * Read more in the {@glink features/bootstrapgrids/bootstrapgrids-styling Bootstrapgrid and column class tools} section.
 * See also the {@link module:bootstrapgrid/bootstrapgridproperties~BootstrapgridProperties} plugin.
 *
 * This is a "glue" plugin that loads the
 * {@link module:bootstrapgrid/bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesediting~BootstrapgridColumnPropertiesEditing bootstrapgrid column properties editing feature} and
 * the {@link module:bootstrapgrid/bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesui~BootstrapgridColumnPropertiesUI bootstrapgrid column properties UI feature}.
 */
export default class BootstrapgridColumnProperties extends Plugin {
    /**
     * @inheritDoc
     */
    public static get pluginName() {
        return 'BootstrapgridColumnProperties' as const;
    }

    /**
     * @inheritDoc
     */
    public static get requires() {
        return [BootstrapgridColumnPropertiesEditing, BootstrapgridColumnPropertiesUI] as const;
    }
}
