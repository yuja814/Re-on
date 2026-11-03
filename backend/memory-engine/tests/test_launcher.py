"""Regression checks for the real Spring-integrated engine entry point."""
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

import run_local


class LauncherTests(TestCase):
    def test_environment_token_works_without_dotenv(self):
        with TemporaryDirectory() as directory:
            run_local.load_token(Path(directory) / 'missing.env', {'REON_ENGINE_TOKEN': 'os-token'})

    def test_environment_wins_over_file(self):
        with TemporaryDirectory() as directory:
            file = Path(directory) / '.env'
            file.write_text('REON_ENGINE_TOKEN=file-token\n', encoding='utf-8')
            env = {'REON_ENGINE_TOKEN': 'os-token'}
            run_local.load_token(file, env)
            self.assertEqual(env['REON_ENGINE_TOKEN'], 'os-token')

    def test_windows_utf8_bom_crlf_comments_and_equals_in_token(self):
        with TemporaryDirectory() as directory:
            file = Path(directory) / '.env'
            file.write_bytes(b'\xef\xbb\xbf# comment\r\n! comment\r\nOTHER_KEY=ignored\r\n REON_ENGINE_TOKEN = value== \r\n')
            env = {}
            run_local.load_token(file, env)
            self.assertEqual(env, {'REON_ENGINE_TOKEN': 'value=='})

    def test_duplicate_file_key_uses_last_value_like_core(self):
        with TemporaryDirectory() as directory:
            file = Path(directory) / '.env'
            file.write_text('REON_ENGINE_TOKEN=first\nREON_ENGINE_TOKEN=last\n', encoding='utf-8')
            env = {}
            run_local.load_token(file, env)
            self.assertEqual(env['REON_ENGINE_TOKEN'], 'last')

    def test_invalid_or_missing_token_fails_without_echoing_secret(self):
        with TemporaryDirectory() as directory:
            missing = Path(directory) / 'missing.env'
            for token in (None, '', ' ', 'secret with spaces', 'secret\nvalue', '비밀값'):
                with self.subTest(token=repr(token)):
                    env = {} if token is None else {'REON_ENGINE_TOKEN': token}
                    with self.assertRaises(ValueError) as error:
                        run_local.load_token(missing, env)
                    if token and not token.isspace():
                        self.assertNotIn(token, str(error.exception))

    def test_blank_environment_does_not_fall_back_to_file(self):
        with TemporaryDirectory() as directory:
            file = Path(directory) / '.env'
            file.write_text('REON_ENGINE_TOKEN=file-token', encoding='utf-8')
            with self.assertRaises(ValueError):
                run_local.load_token(file, {'REON_ENGINE_TOKEN': ''})

    def test_unreadable_file_has_actionable_error(self):
        with TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'Cannot read backend/.env'):
                run_local.load_token(Path(directory), {})

    def test_default_launcher_matches_spring_port_and_is_cwd_independent(self):
        with patch.object(run_local, 'load_token') as load, patch.object(run_local.uvicorn, 'run') as serve:
            run_local.main([])
        load.assert_called_once_with(run_local.ENGINE_DIR.parent / '.env')
        serve.assert_called_once_with('api:app', app_dir=str(run_local.ENGINE_DIR), host='127.0.0.1',
                                      port=18081, log_level='warning', access_log=False)

    def test_custom_port_is_passed_to_server(self):
        with patch.object(run_local, 'load_token'), patch.object(run_local.uvicorn, 'run') as serve:
            run_local.main(['--port', '18083'])
        self.assertEqual(serve.call_args.kwargs['port'], 18083)

    def test_missing_token_stops_before_server_starts(self):
        with patch.object(run_local, 'load_token', side_effect=ValueError('Missing token')), \
                patch.object(run_local.uvicorn, 'run') as serve:
            with self.assertRaisesRegex(SystemExit, 'Missing token'):
                run_local.main([])
        serve.assert_not_called()
