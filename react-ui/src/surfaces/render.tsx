import {renderToString} from 'react-dom/server';
import {FrontendShell} from '../FrontendShell';
import {Landing} from './Landing';
import {Home} from './Home';
import {PlanningHost} from './PlanningHost';
import {SessionEditor} from './SessionEditor';
import {SessionPreview} from './SessionPreview';
import {QuickSession} from './QuickSession';
import {AuthDialog} from './AuthDialog';
import {ConfirmDialogSurface} from './ConfirmDialogSurface';
import {TermsDialog} from './TermsDialog';
import {PdfGuide} from './PdfGuide';
import {EngineRequired} from './EngineRequired';
import {SessionLibraryDialog} from './SessionLibraryDialog';
import {LogoGallery} from './LogoGallery';
import {RefineText} from './RefineText';
import {GlobalOverlays} from './GlobalOverlays';
import {EditorOverlays} from './EditorOverlays';
import {Icons} from './Icons';
import {Downloads} from './Downloads';
import {ConnectionPage} from '../ConnectionPage';

export function renderSurfaces() {
    return Object.fromEntries(Object.entries({Landing,Home,PlanningHost,SessionEditor,SessionPreview,QuickSession,
        AuthDialog,ConfirmDialogSurface,TermsDialog,PdfGuide,EngineRequired,SessionLibraryDialog,
        LogoGallery,RefineText,GlobalOverlays,EditorOverlays,Icons,FrontendShell,Downloads,ConnectionPage})
        .map(([name,Component])=>[name,renderToString(<Component/>)]));
}
