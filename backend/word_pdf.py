"""Hidden, isolated Word PDF conversion suitable for a server worker thread."""
from pathlib import Path
from threading import Lock

_WORD_LOCK = Lock()


def convert_docx_to_pdf(source: str | Path, destination: str | Path) -> None:
    import pythoncom
    import win32com.client

    # Each asyncio worker thread needs its own COM initialization. DispatchEx
    # ensures that closing this instance never closes the user's open Word.
    with _WORD_LOCK:
        pythoncom.CoInitialize()
        application = document = None
        try:
            application = win32com.client.DispatchEx('Word.Application')
            application.Visible = False
            application.DisplayAlerts = 0
            document = application.Documents.Open(
                str(Path(source).resolve()), ReadOnly=True, AddToRecentFiles=False)
            document.ExportAsFixedFormat(str(Path(destination).resolve()), 17)
        finally:
            try:
                if document is not None:
                    document.Close(0)
            finally:
                try:
                    if application is not None:
                        application.Quit()
                finally:
                    pythoncom.CoUninitialize()
