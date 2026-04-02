import UIKit
import Social
import UniformTypeIdentifiers
import WebKit

class ShareViewController: UIViewController, WKNavigationDelegate {

    // IMPORTANT: Replace this with your actual App Group ID
    let appGroupID = "group.com.owencampbell.fudi.foodie"
    
    // UI Elements
    private let containerView = UIView()
    private let titleLabel = UILabel()
    private let statusLabel = UILabel()
    private let actionButton = UIButton(type: .system)
    private let activityIndicator = UIActivityIndicatorView(style: .large)
    
    // Nuclear Option: WebView for launching schemes
    private lazy var webView: WKWebView = {
        let config = WKWebViewConfiguration()
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        return web
    }()
    
    // State
    private var capturedURL: String?

    // ... (ViewDidLoad and SetupUI remain mostly the same, ensuring WebView is added but hidden) ...
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        
        // Add hidden webview
        view.addSubview(webView)
        webView.isHidden = true
        
        extractSharedURL()
    }
    
    // ... (SetupUI and extractSharedURL remain same) ...
    
    private func setupUI() {
        // Blur Background
        let blurEffect = UIBlurEffect(style: .systemThinMaterial)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.frame = view.bounds
        blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(blurView)
        
        // Container
        containerView.backgroundColor = .systemBackground
        containerView.layer.cornerRadius = 16
        containerView.layer.shadowColor = UIColor.black.cgColor
        containerView.layer.shadowOpacity = 0.2
        containerView.layer.shadowOffset = CGSize(width: 0, height: 4)
        containerView.layer.shadowRadius = 10
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)
        
        // Title
        titleLabel.text = "Fudi Recipe Extractor"
        titleLabel.font = UIFont.systemFont(ofSize: 20, weight: .bold)
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(titleLabel)
        
        // Status
        statusLabel.text = "Looking for recipe URL..."
        statusLabel.font = UIFont.systemFont(ofSize: 16)
        statusLabel.textColor = .secondaryLabel
        statusLabel.textAlignment = .center
        statusLabel.numberOfLines = 0
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(statusLabel)
        
        // Activity Indicator
        activityIndicator.hidesWhenStopped = true
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(activityIndicator)
        
        // Action Button
        actionButton.setTitle("Tap to Extract", for: .normal)
        actionButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        actionButton.backgroundColor = UIColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1.0) // Almost black
        actionButton.setTitleColor(.white, for: .normal)
        actionButton.layer.cornerRadius = 12
        actionButton.translatesAutoresizingMaskIntoConstraints = false
        actionButton.addTarget(self, action: #selector(handleExtractTap), for: .touchUpInside)
        actionButton.isHidden = true // Hidden until URL found
        containerView.addSubview(actionButton)
        
        // Close Button (Top Right)
        let closeButton = UIButton(type: .close)
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.addTarget(self, action: #selector(handleClose), for: .touchUpInside)
        containerView.addSubview(closeButton)

        // Constraints
        NSLayoutConstraint.activate([
            // Center Container
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -50),
            containerView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.85),
            containerView.heightAnchor.constraint(greaterThanOrEqualToConstant: 250),
            
            // Title
            titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 24),
            titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),
            
            // Status
            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16),
            statusLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            
            // Activity Indicator
            activityIndicator.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            activityIndicator.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            
            // Button
            actionButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 24),
            actionButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 24),
            actionButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -24),
            actionButton.heightAnchor.constraint(equalToConstant: 50),
            actionButton.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -24),
            
            // Close
            closeButton.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 12),
            closeButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12)
        ])
    }
    
    // MARK: - Logic
    
    private func extractSharedURL() {
        activityIndicator.startAnimating()
        
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = item.attachments else {
            statusLabel.text = "No content found."
            activityIndicator.stopAnimating()
            return
        }
        
        for attachment in attachments {
            if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (url, error) in
                    DispatchQueue.main.async {
                        self?.activityIndicator.stopAnimating()
                        
                        if let sharedURL = url as? URL {
                            self?.capturedURL = sharedURL.absoluteString
                            self?.statusLabel.text = "Recipe URL Found!"
                            self?.actionButton.isHidden = false
                        } else {
                            self?.statusLabel.text = "Error: Invalid URL"
                        }
                    }
                }
                return
            }
        }
        
        activityIndicator.stopAnimating()
        statusLabel.text = "No link found in shared content."
    }

    @objc private func handleExtractTap() {
        guard let urlString = capturedURL else { return }
        
        statusLabel.text = "Opening Fudi..."
        actionButton.isEnabled = false
        actionButton.alpha = 0.5
        
        saveURLToAppGroup(urlString)
        openMainApp(with: urlString)
    }
    
    @objc private func handleClose() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    private func saveURLToAppGroup(_ urlString: String) {
        if let userDefaults = UserDefaults(suiteName: appGroupID) {
            userDefaults.set(urlString, forKey: "sharedRecipeURL")
            userDefaults.set(Date(), forKey: "sharedRecipeURLTimestamp")
            userDefaults.synchronize()
            NSLog("[FoodieShare] Saved URL: %@", urlString)
        } else {
            NSLog("[FoodieShare] ERROR: App Group Access Failed")
        }
    }
    
    private func openMainApp(with urlString: String) {
        let encoded = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        guard let appURL = URL(string: "fudiapp://recipe?url=\(encoded)") else { return }
        
        DispatchQueue.main.async {
            self.statusLabel.text = "Attempting WebKit Jump..."
        }
        
        // Nuclear Option v2: JS Redirect + Permissions
        // Now that we have LSApplicationQueriesSchemes in Info.plist, this HTML redirect should bypass the "Unsupported URL" error.
        let html = "<html><head><script>window.location.href = \"\(appURL.absoluteString)\";</script></head><body>Redirecting via JS...</body></html>"
        webView.loadHTMLString(html, baseURL: nil)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.statusLabel.text = "Jump Attempted.\nTap Done to close."
            self.prepareForManualClose()
        }
    }
    
    private func prepareForManualClose() {
        actionButton.isEnabled = true
        actionButton.alpha = 1.0
        actionButton.backgroundColor = .systemGray
        actionButton.setTitle("Done", for: .normal)
        // Re-bind target to close only
        actionButton.removeTarget(self, action: #selector(handleExtractTap), for: .touchUpInside)
        actionButton.addTarget(self, action: #selector(handleClose), for: .touchUpInside)
    }
    
    private func completeExtensionRequest(delay: TimeInterval) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
    
    private func resetUI() {
        actionButton.isEnabled = true
        actionButton.alpha = 1.0
        actionButton.setTitle("Retry Extract", for: .normal)
    }
}
