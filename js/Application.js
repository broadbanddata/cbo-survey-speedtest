import Configurable from "./support/Configurable.js";

class Application extends Configurable {

  _configPath = './config/application.json';
  
  constructor() {
    super();
    this.loadConfig(this._configPath).then(() => {

      document.querySelectorAll('.application-title').forEach(node => {
        node.innerHTML = this.config.title || 'Application';
      });

	  console.log("Inialize toggle panels");
      this.initializeTogglePanels();

      const testCompleteHandler = this.initializeSurvey123();

      this.initializeOOKLA({ooklaUrl: this.config.ooklaUrl, testCompleteHandler});

    });
  }

	initializeTogglePanels() {

    const survey123Panel = document.getElementById('survey123-panel');
    const ooklaPanel = document.getElementById('ookla-panel');
	
    this.togglePanel = (panelId, delay) => {
      setTimeout(() => {
        survey123Panel.classList.toggle('hide', (panelId !== survey123Panel.id));
        ooklaPanel.classList.toggle('hide', (panelId !== ooklaPanel.id));
      }, delay || 500);
    };

  }


  initializeSurvey123() {
    const isURL = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g;
    const _isValidURL = (string) => {
      return string && isURL.test(string);
    };

    const hasValidRedirectURL = _isValidURL(this.config.redirectOnSubmitUrl);

    const redirectOnSubmit = () => {
      window.open(this.config.redirectOnSubmitUrl, "_top");
    }


    const survey123WebForm = new Survey123WebForm({
      container: "survey123-panel",
      portalUrl: this.config.portalUrl,
      clientId: this.config.clientId,
      itemId: this.config.itemId,
      autoRefresh: hasValidRedirectURL ? 0 : 3,
      onFormLoaded: function (data) {
        if (hasValidRedirectURL) {
          survey123WebForm.setOnFormSubmitted(redirectOnSubmit);
        }
        survey123WebForm.setOnQuestionValueChanged(onQuestionValueChange);
      }
    });

    const onQuestionValueChange = (data) => {
      if ((data.field === this.config.surveyInternetQuestion) && (data.value === 'yes')) {
        this.togglePanel('ookla-panel');
      }

    };

	//Format Speeds
    const speedFormatter = new Intl.NumberFormat('default', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const toMbps = val => (val ? speedFormatter.format(val / 1000.0) : 'n/a');
    const toLatency = val => Math.round(val).toFixed(0);

    const testCompleteHandler = (data) => {
      survey123WebForm.setQuestionValue({"downloadSpeed": toMbps(data.download)});
      survey123WebForm.setQuestionValue({"uploadSpeed": toMbps(data.upload)});
      survey123WebForm.setQuestionValue({"ping": toLatency(data.latency.minimum)});
      survey123WebForm.setQuestionValue({"jitter": toLatency(data.latency.jitter)});
      survey123WebForm.setQuestionValue({"testId": data.config.testId});

      this.togglePanel('survey123-panel', 2000);
    }

    return testCompleteHandler;
  }


  initializeOOKLA({ooklaUrl, testCompleteHandler}) {
    if (ooklaUrl) {
      const ooklaContainer = document.getElementById('ookla-container');
      ooklaContainer.src = ooklaUrl;
	
      const ooklaTestCompleted = (event) => {
        if (event.origin !== this.config.ooklaUrl) { return; }
        testCompleteHandler && testCompleteHandler(event.data);
      }
      const attachToWindow = (listener) => {
        if (window.addEventListener) {
          window.addEventListener("message", listener);
        } else if (window.attachEvent) {
          window.attachEvent("onmessage", listener);
        }
      }
	      attachToWindow(ooklaTestCompleted);
    } else {
      console.error(new Error(`Missing 'ooklaUrl' parameter...`));
    }
  }

}

export default new Application();
