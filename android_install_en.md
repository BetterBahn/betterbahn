# Betterbahn on Android – User Guide

This guide explains how to install, start, and stop Betterbahn on an Android device.
**No Linux or technical knowledge is required.**

---

## Requirements

* Android smartphone or tablet
* Stable internet connection
* At least **5 GB of free storage** (10 GB recommended)
* **[Termux](https://f-droid.org/packages/com.termux/)** (recommended installation from **[F-Droid](https://f-droid.org/)**)

Recommended:

* **[Termux:Widget](https://f-droid.org/de/packages/com.termux.widget/)** (for a launch icon on the home screen)

---

## Android Permission

For the home screen widget to work, **Termux** needs an additional permission.

### Granting the permission

1. Open **Android Settings**
2. Go to **Apps → Termux**
3. Select **“Display over other apps”** (or a similarly named option)
4. **Allow / Enable** it

Without this permission, the home screen widget will not work.

---

## Installing Betterbahn

1. **Open Termux**

2. **Enter the installation command**
   (exactly as shown, all in one line):

   ```sh
   curl -LO https://raw.githubusercontent.com/BetterBahn/betterbahn/refs/heads/main/termux-installer.sh && chmod +x termux-installer.sh && ./termux-installer.sh
   ```

3. **Read the prompts**

   * Press **ENTER** to continue
   * Press **CTRL+C** to cancel

4. **Wait**
   The installation may take several minutes (on a Pixel 9 it took about 10–20 minutes).
   Do **not lock the device** during installation.

After completion, a success message will appear.

---

## Starting Betterbahn

### Option A: Start via Termux

1. Open Termux

2. Run the start command:

   ```sh
   ~/start-betterbahn.sh
   ```

3. After a few seconds, the browser will automatically open with Betterbahn.

---

### Option B: Start via Home Screen (recommended)

1. Install **Termux:Widget**
   (from the same source as Termux, e.g. F-Droid)

2. Long-press on the **home screen**

3. Select **Widgets → Termux:Widget**

4. Choose **Betterbahn**

From now on, a **single tap** on the home screen is enough.

If an error message appears saying `Listen on ... Failed`, Betterbahn is already running and can be accessed at:
**[http://localhost:3000](http://localhost:3000)**

---

## Stopping Betterbahn

* Press **CTRL+C** in Termux
  or
* Close Termux completely

This will shut down Betterbahn cleanly.

---

## Frequently Asked Questions

**Does Termux have to stay open?**
Yes. As long as Betterbahn is running, Termux must remain active in the background.

**Is Docker used?**
No. Docker is **not** required and is not installed.

**Does this modify my Android system?**
No. Everything runs isolated inside Termux.

**Can I remove Betterbahn again?**
Yes. Simply delete the Betterbahn Proot.

---

## Troubleshooting Tips

* Use Wi-Fi instead of mobile data
* Make sure the battery does not run out
* If the browser does not open automatically:

  * Check the “display over other apps” permission
  * Restart Termux once
  * Try starting Betterbahn again
