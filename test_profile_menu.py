import os
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_tests():
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1280,900')

    driver = webdriver.Chrome(options=options)
    
    try:
        # 1. Load login page
        login_url = "http://localhost:8000/login.html"
        print("Navigating to login:", login_url)
        driver.get(login_url)

        # Login as demo user
        demo_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "demoBtn"))
        )
        demo_btn.click()
        time.sleep(2)

        # Ensure redirected or navigate to profile.html
        profile_url = "http://localhost:8000/profile.html"
        driver.get(profile_url)
        time.sleep(2)

        print("Current page title:", driver.title)
        assert "Profile" in driver.title, "Not on Profile page"

        # Check user profile display
        username_el = driver.find_element(By.ID, "profileUsername")
        print("Logged in user username display:", username_el.text)

        # ----------------------------------------------------
        # TEST 1: Account Information
        # ----------------------------------------------------
        print("\n--- Testing 1: Account Information ---")
        acc_row = driver.find_element(By.ID, "accountInfoRow")
        acc_row.click()
        time.sleep(1)

        sub_view = driver.find_element(By.ID, "profileSubViewOverlay")
        assert "open" in sub_view.get_attribute("class"), "Sub-view overlay didn't open"
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        print("Sub-view Title:", sub_title)
        assert "Account Information" in sub_title

        # Check user details displayed
        display_card = driver.find_element(By.ID, "accountInfoDisplayCard")
        assert display_card.is_displayed(), "Account info display card is not visible"
        print("Account info display card is visible")

        # Open edit form
        open_edit_btn = driver.find_element(By.ID, "openEditInfoBtn")
        open_edit_btn.click()
        time.sleep(0.5)

        edit_sec = driver.find_element(By.ID, "editInfoSection")
        assert edit_sec.is_displayed(), "Edit section did not open"
        print("Edit form opened successfully")

        # Edit first name and last name
        first_input = driver.find_element(By.ID, "editFirstName")
        first_input.clear()
        first_input.send_keys("Alex")

        last_input = driver.find_element(By.ID, "editLastName")
        last_input.clear()
        last_input.send_keys("Rivera")

        save_acc_btn = driver.find_element(By.ID, "saveAccountInfoBtn")
        save_acc_btn.click()
        time.sleep(1.5)

        # Verify toast or updated info in card
        display_card = driver.find_element(By.ID, "accountInfoDisplayCard")
        assert "Alex" in display_card.text, "Updated first name Alex not in display card"
        print("Account information edit and save passed!")

        # Close sub-view
        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 2: My Posts
        # ----------------------------------------------------
        print("\n--- Testing 2: My Posts ---")
        driver.find_element(By.ID, "myPostsRow").click()
        time.sleep(1)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "My Posts" in sub_title
        print("My Posts view opened successfully:", sub_title)
        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 3: Saved Posts
        # ----------------------------------------------------
        print("\n--- Testing 3: Saved Posts ---")
        driver.find_element(By.ID, "savedPostsRow").click()
        time.sleep(1)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "Saved Posts" in sub_title
        print("Saved Posts view opened successfully:", sub_title)
        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 4: Privacy & Security (Toggles, Password, Danger Zone)
        # ----------------------------------------------------
        print("\n--- Testing 4: Privacy & Security ---")
        driver.find_element(By.ID, "privacySecurityRow").click()
        time.sleep(1)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "Privacy & Security" in sub_title
        print("Privacy & Security view opened successfully")

        # Toggle anonymous posting
        anon_toggle = driver.find_element(By.ID, "privacyAnonToggle")
        initial_anon = anon_toggle.is_selected()
        driver.execute_script("arguments[0].click();", anon_toggle)
        time.sleep(0.5)
        print("Toggled anonymous posting")

        # Test Deactivate Modal trigger
        deact_btn = driver.find_element(By.ID, "openDeactivateModalTriggerBtn")
        deact_btn.click()
        time.sleep(0.5)
        deact_modal = driver.find_element(By.ID, "deactivateModalOverlay")
        assert "open" in deact_modal.get_attribute("class"), "Deactivate modal didn't open"
        print("Deactivate modal opened successfully")
        driver.find_element(By.ID, "cancelDeactivateBtn").click()
        time.sleep(0.5)
        assert "open" not in deact_modal.get_attribute("class"), "Deactivate modal didn't close"

        # Test Delete Account Modal trigger
        del_btn = driver.find_element(By.ID, "openDeleteAccountModalTriggerBtn")
        del_btn.click()
        time.sleep(0.5)
        del_modal = driver.find_element(By.ID, "deleteAccountModalOverlay")
        assert "open" in del_modal.get_attribute("class"), "Delete modal didn't open"
        print("Delete Account danger modal opened successfully")

        confirm_del_btn = driver.find_element(By.ID, "confirmDeleteAccountBtn")
        assert not confirm_del_btn.is_enabled(), "Delete button must be disabled initially"

        del_input = driver.find_element(By.ID, "deleteConfirmInput")
        del_input.send_keys("delete")
        assert not confirm_del_btn.is_enabled(), "Lowercase 'delete' should not enable button"

        del_input.clear()
        del_input.send_keys("DELETE")
        assert confirm_del_btn.is_enabled(), "Exact 'DELETE' must enable button"
        print("Delete confirmation validation strictly requires 'DELETE' - PASSED")

        driver.find_element(By.ID, "cancelDeleteAccountBtn").click()
        time.sleep(0.5)
        assert "open" not in del_modal.get_attribute("class")

        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 5: Theme & Appearance
        # ----------------------------------------------------
        print("\n--- Testing 5: Theme & Appearance ---")
        driver.find_element(By.ID, "themeAppearanceRow").click()
        time.sleep(0.5)
        theme_modal = driver.find_element(By.ID, "themeModalOverlay")
        assert "open" in theme_modal.get_attribute("class"), "Theme modal didn't open"
        print("Theme modal opened successfully")

        driver.find_element(By.ID, "doneThemeBtn").click()
        time.sleep(0.5)
        assert "open" not in theme_modal.get_attribute("class"), "Theme modal didn't close"

        # Also test Settings Gear icon in upper-right
        settings_gear = driver.find_element(By.ID, "profileSettingsBtn")
        settings_gear.click()
        time.sleep(0.5)
        assert "open" in theme_modal.get_attribute("class"), "Settings gear didn't open theme modal"
        driver.find_element(By.ID, "doneThemeBtn").click()
        time.sleep(0.5)
        print("Settings gear in upper-right works and opened Theme settings!")

        # ----------------------------------------------------
        # TEST 6: Notifications
        # ----------------------------------------------------
        print("\n--- Testing 6: Notifications ---")
        driver.find_element(By.ID, "notificationsRow").click()
        time.sleep(1)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "Notifications" in sub_title
        print("Notifications view opened successfully")

        # Mark all as read
        mark_all_btn = driver.find_element(By.ID, "markAllReadBtn")
        mark_all_btn.click()
        time.sleep(1)
        print("Notifications read status updated!")
        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 7: Blocked Users
        # ----------------------------------------------------
        print("\n--- Testing 7: Blocked Users ---")
        # Add a mock blocked user via script in localStorage
        driver.execute_script("""
            var cur = JSON.parse(localStorage.getItem('safe_space_user'));
            var key = 'safe_space_blocks_' + cur.id;
            localStorage.setItem(key, JSON.stringify([
                { id: 'blocked-1', username: 'strongest', first_name: 'Strongest', last_name: 'User', avatar_url: null }
            ]));
        """)

        driver.find_element(By.ID, "blockedUsersRow").click()
        time.sleep(1)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "Blocked Users" in sub_title
        print("Blocked users view opened with blocked user")

        blocked_card = driver.find_element(By.ID, "blocked-card-blocked-1")
        assert blocked_card.is_displayed()
        assert "@strongest" in blocked_card.text

        # Click unblock
        unblock_btn = blocked_card.find_element(By.TAG_NAME, "button")
        unblock_btn.click()
        time.sleep(0.5)

        unblock_modal = driver.find_element(By.ID, "unblockModalOverlay")
        assert "open" in unblock_modal.get_attribute("class")
        print("Unblock confirmation modal appeared")

        driver.find_element(By.ID, "confirmUnblockBtn").click()
        time.sleep(1)
        print("Unblock confirmed and executed successfully")

        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 8: About the App
        # ----------------------------------------------------
        print("\n--- Testing 8: About the App ---")
        driver.find_element(By.ID, "aboutAppRow").click()
        time.sleep(0.5)
        sub_title = driver.find_element(By.ID, "subViewTitle").text
        assert "About Safe Space" in sub_title
        content_text = driver.find_element(By.ID, "subViewContent").text
        assert "Aklan State University – Ibajay Campus" in content_text
        assert "2025–2026" in content_text
        assert "Version: 1.0.0" in content_text
        print("About Safe Space text verified with university, version, and AY 2025-2026!")
        driver.find_element(By.ID, "closeSubViewBtn").click()
        time.sleep(0.5)

        # ----------------------------------------------------
        # TEST 9: Logout Confirmation & Execution
        # ----------------------------------------------------
        print("\n--- Testing 9: Logout ---")
        driver.find_element(By.ID, "logoutRow").click()
        time.sleep(0.5)
        logout_modal = driver.find_element(By.ID, "logoutModalOverlay")
        assert "open" in logout_modal.get_attribute("class")
        print("Logout confirmation modal opened")

        # Cancel first
        driver.find_element(By.ID, "cancelLogoutBtn").click()
        time.sleep(0.5)
        assert "open" not in logout_modal.get_attribute("class")
        print("Logout cancel verified")

        # Re-open and confirm
        driver.find_element(By.ID, "logoutRow").click()
        time.sleep(0.5)
        driver.find_element(By.ID, "confirmLogoutBtn").click()
        time.sleep(2)

        print("Current URL after logout:", driver.current_url)
        assert "login.html" in driver.current_url or "welcome.html" in driver.current_url
        print("Logout session destroyed and redirected to login/welcome!")

        print("\n==========================================")
        print("ALL 9 PROFILE MENU TESTS PASSED PERFECTLY!")
        print("==========================================")

    finally:
        driver.quit()

if __name__ == '__main__':
    run_tests()
