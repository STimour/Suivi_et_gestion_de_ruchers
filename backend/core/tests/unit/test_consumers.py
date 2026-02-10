from django.test import TestCase
from core.consumers import _normalize_email, _group_name_for_email


class NormalizeEmailTest(TestCase):
    def test_lowercase_strip(self):
        self.assertEqual(_normalize_email('  Test@Email.COM  '), 'test@email.com')

    def test_empty(self):
        self.assertEqual(_normalize_email(''), '')

    def test_none(self):
        self.assertEqual(_normalize_email(None), '')


class GroupNameTest(TestCase):
    def test_simple_email(self):
        name = _group_name_for_email('user@test.com')
        self.assertTrue(name.startswith('email_verification_'))
        self.assertIn('user_test.com', name)

    def test_special_chars(self):
        name = _group_name_for_email('user+tag@test.com')
        self.assertNotIn('+', name)

    def test_max_length(self):
        long_email = 'a' * 200 + '@test.com'
        name = _group_name_for_email(long_email)
        self.assertLessEqual(len(name), 100)
