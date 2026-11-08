/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    settings: import('./data/settings').SiteSettings;
  }
}
