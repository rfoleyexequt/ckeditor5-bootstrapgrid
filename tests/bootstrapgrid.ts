import { expect } from 'chai';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import Bootstrapgrid from '../src/bootstrapgrid';

describe( 'Bootstrapgrid', () => {
	it( 'should be named', () => {
		expect( Bootstrapgrid.pluginName ).to.equal( 'Bootstrapgrid' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Bootstrapgrid,
                                        SourceEditing
				],
				toolbar: [
					'bootstrapgridButton',
                                        'sourceEditing'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Bootstrapgrid', () => {
			const myPlugin = editor.plugins.get( 'Bootstrapgrid' );

			expect( myPlugin ).to.be.an.instanceof( Bootstrapgrid );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'bootstrapgridButton' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'bootstrapgridButton' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
