import { expect } from 'chai';
import { Bootstrapgrid as BootstrapgridDll, icons } from '../src';
import Bootstrapgrid from '../src/bootstrapgrid';

import ckeditor from './../theme/icons/bootstrapgrid.svg';

describe( 'CKEditor5 Bootstrapgrid DLL', () => {
	it( 'exports Bootstrapgrid', () => {
		expect( BootstrapgridDll ).to.equal( Bootstrapgrid );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
