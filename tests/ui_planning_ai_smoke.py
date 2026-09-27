"""AI planning proposal flow at mobile and desktop sizes."""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads((ROOT / "data/pedagogy/fixtures/secondary_math_project_unit.v2.json").read_text(encoding="utf-8"))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


AI_MOCK = """fixture => {
    window.__planningAiFixture = fixture;
    window.__planningAiCalls = [];
    window.__planningAiMode = 'error';
    window.__planningAiResolve = null;
    window.__planningAiProposal = body => {
        const proposal = structuredClone(window.__planningAiFixture);
        const input = body.input;
        proposal.identity.planningType = input.planningType;
        proposal.identity.level = input.level;
        proposal.identity.cycle = input.cycle;
        proposal.identity.grade = input.grade;
        proposal.identity.duration = structuredClone(input.duration);
        proposal.administrativeContext = structuredClone(input.teacherContext);
        proposal.learnerContext = structuredClone(input.learnerContext);
        proposal.curriculumMap = structuredClone(input.curriculumReferences);
        const curriculum = proposal.curriculumMap[0];
        curriculum.criteria = [{ id: 'criterion-ai', description: 'Justifica sus decisiones con procedimientos verificables.' }];
        curriculum.expectedEvidence = [{ id: 'evidence-ai', description: 'Propuesta argumentada.' }];
        proposal.methodologyConfig.primary = {
            profileId: input.profiles.methodology.id,
            profileVersion: input.profiles.methodology.profileVersion,
            code: input.profiles.methodology.code
        };
        proposal.methodologyConfig.custom = null;
        proposal.sequence.forEach((item, index) => {
            item.index = index + 1;
            item.curriculumMapRefs = [curriculum.id];
            item.competencyRefs = [curriculum.competency.id];
            item.capacityRefs = curriculum.capacities.map(capacity => capacity.id);
            item.criterionRefs = ['criterion-ai'];
        });
        proposal.finalProduct.criterionRefs = ['criterion-ai'];
        return proposal;
    };
    window.SupabaseClient.getUserEntitlements = async () => ({
        ok: true, features: { 'planning.unit': true, 'planning.experience': true }
    });
    window.SupabaseClient.invokeFunction = async (functionName, body) => {
        window.__planningAiCalls.push({ functionName, body: structuredClone(body) });
        if (window.__planningAiMode === 'error') {
            throw Object.assign(new Error('Proveedor temporalmente no disponible.'), { code: 'PROVIDER_ERROR' });
        }
        const proposal = window.__planningAiProposal(body);
        if (window.__planningAiMode === 'pending') {
            return new Promise(resolve => { window.__planningAiResolve = () => resolve(proposal); });
        }
        return proposal;
    };
}"""


def click_and_confirm(page, locator):
    messages = []
    def accept(dialog):
        messages.append(dialog.message)
        dialog.accept()
    page.once('dialog', accept)
    locator.click()
    assert messages and 'puede reemplazar parte del contenido actual' in messages[0]


def click_and_cancel(page, locator):
    messages = []
    def cancel(dialog):
        messages.append(dialog.message)
        dialog.dismiss()
    page.once('dialog', cancel)
    locator.click()
    assert messages and 'puede reemplazar parte del contenido actual' in messages[0]


def prepare_minimum_context(page):
    page.locator('[data-path="identity.duration.value"]').fill('3')
    page.locator('[data-step="1"]').click()
    page.locator('[data-path="significantSituation.context"]').fill('Contexto manual que debe conservarse.')
    page.locator('[data-step="2"]').click()
    page.locator('[data-planning-action="curriculum"]').click()
    page.locator('[data-step="3"]').click()
    page.locator('#planning-methodology').select_option('project_based_learning')


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for width in (375, 1280):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
                page.evaluate("window.LandingRouter.showHome(false)")
                page.evaluate(AI_MOCK, FIXTURE)
                page.locator('[data-open-planning]').click()
                page.locator('[data-type="project"]').click()

                page.locator('[data-planning-action="mode-manual"]').wait_for()
                assert page.locator('[data-planning-action="mode-manual"]').is_visible()
                assert page.locator('[data-planning-action="mode-ai"]').is_visible()
                page.locator('[data-planning-action="mode-ai"]').click()
                assert page.locator('[data-planning-action="generate-ai"]').is_disabled()
                assert 'Falta completar' in page.locator('#planning-ai-help').inner_text()

                prepare_minimum_context(page)
                generate = page.locator('[data-planning-action="generate-ai"]')
                assert generate.is_enabled()

                click_and_cancel(page, generate)
                assert page.evaluate("window.__planningAiCalls.length") == 0
                page.locator('[data-step="1"]').click()
                assert page.locator('[data-path="significantSituation.context"]').input_value() == 'Contexto manual que debe conservarse.'

                click_and_confirm(page, generate)
                page.locator('#planning-notice').filter(has_text='proveedor de IA').wait_for()
                assert page.locator('#planning-notice').evaluate('el => el === document.activeElement')
                assert page.evaluate("window.__planningAiCalls.length") == 1
                page.locator('[data-step="1"]').click()
                assert page.locator('[data-path="significantSituation.context"]').input_value() == 'Contexto manual que debe conservarse.'

                page.evaluate("window.__planningAiMode = 'pending'")
                click_and_confirm(page, page.locator('[data-planning-action="generate-ai"]'))
                loading = page.locator('[data-planning-action="generate-ai"]')
                assert loading.is_disabled()
                assert 'Generando propuesta pedagógica' in loading.inner_text()
                assert page.evaluate("window.__planningAiCalls.length") == 2
                page.evaluate("window.__planningAiResolve()")
                page.locator('#planning-proposal-title').wait_for()
                assert page.locator('#planning-proposal-title').evaluate('el => el === document.activeElement')
                proposal_text = page.locator('.planning-proposal').text_content()
                assert 'Propuesta generada' in proposal_text
                assert 'Borrador' in proposal_text

                page.evaluate("window.__planningAiMode = 'success'")
                click_and_confirm(page, page.locator('[data-planning-action="regenerate-ai"]'))
                page.locator('#planning-proposal-title').wait_for()
                calls = page.evaluate("window.__planningAiCalls")
                assert len(calls) == 3
                assert calls[1]['functionName'] == 'ai-gateway' and calls[2]['functionName'] == 'ai-gateway'
                assert calls[1]['body']['requestId'] != calls[2]['body']['requestId']

                page.locator('[data-planning-action="discard-ai"]').click()
                page.locator('[data-step="1"]').click()
                assert page.locator('[data-path="significantSituation.context"]').input_value() == 'Contexto manual que debe conservarse.'

                page.locator('[data-planning-action="mode-ai"]').click()
                click_and_confirm(page, page.locator('[data-planning-action="generate-ai"]'))
                page.locator('#planning-proposal-title').wait_for()
                accept = page.locator('[data-planning-action="accept-ai"]')
                accept.focus()
                accept.press('Enter')
                assert page.locator('#planning-step-title').evaluate('el => el === document.activeElement')
                assert page.locator('[data-path="identity.title"]').input_value() == FIXTURE['identity']['title']
                page.locator('[data-planning-action="save"]').click()
                page.locator('#planning-notice').filter(has_text='Borrador guardado').wait_for()
                saved = page.evaluate("JSON.parse(localStorage.getItem('spacelab_planning_containers'))[0].containerData")
                assert saved['status'] == 'draft'
                assert saved['revision'] == 1
                assert page.locator('#planning-dialog').evaluate('el => el.scrollWidth <= el.clientWidth')
                assert not errors, errors
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
    print('ui_planning_ai_smoke.py: OK')
