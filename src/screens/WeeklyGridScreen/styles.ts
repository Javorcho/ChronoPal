import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  weekNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekNavButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavButtonMobile: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayButtonMobile: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  // View toggle button styles
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Monthly calendar styles
  monthlyContainer: {
    flex: 1,
  },
  monthlyHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthlyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyWeekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  monthlyWeekDay: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  monthlyGrid: {
    flex: 1,
    paddingHorizontal: 8,
  },
  monthlyGridInner: {
    paddingVertical: 8,
  },
  monthlyWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthlyDayCell: {
    flex: 1,
    minHeight: 100,
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
  },
  monthlyDayNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  monthlyActivityIndicators: {
    flex: 1,
    gap: 2,
  },
  monthlyActivityDot: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  monthlyActivityDotText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  monthlyMoreText: {
    fontSize: 10,
    marginTop: 2,
  },
  monthlyBackButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  monthlyBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  monthlyBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  mobileViewToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  todayButtonMobileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addActivityDesktopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addActivityDesktopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  myActivitiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  myActivitiesButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiHelperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  aiHelperButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  recurringActivitiesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewActivities: {
    gap: 12,
  },
  previewDayGroup: {
    gap: 6,
  },
  previewDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  previewDayName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewDayCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewActivityItem: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    marginLeft: 8,
  },
  previewActivityColorBar: {
    width: 4,
  },
  previewActivityInfo: {
    flex: 1,
    padding: 12,
  },
  previewActivityName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewActivityMeta: {
    fontSize: 12,
  },
  aiHelperButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  aiHelperButtonMobileText: {
    fontSize: 15,
    fontWeight: '600',
  },
  aiHelperContent: {
    padding: 20,
    gap: 20,
  },
  aiHelperHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  aiHelperTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  aiHelperSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiHelperButtonMobileFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  aiHelperButtonMobileFullText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  aiHelperInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  aiHelperInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Import Calendar Button
  importCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  importCalendarButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  importMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importMessageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Activities Panel (Desktop)
  activitiesPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    borderLeftWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
  },
  activitiesPanelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activitiesPanelHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activitiesPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  activitiesPanelClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitiesPanelCount: {
    fontSize: 13,
  },
  activitiesPanelScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  activitiesPanelEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  activitiesPanelEmptyText: {
    fontSize: 14,
  },
  activitiesPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activitiesPanelItemColor: {
    width: 4,
    height: '100%',
    minHeight: 54,
  },
  activitiesPanelItemInfo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activitiesPanelItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activitiesPanelItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activitiesPanelItemDay: {
    fontSize: 12,
    fontWeight: '500',
  },
  activitiesPanelItemTime: {
    fontSize: 11,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header with curved nav notch
  headerWithNav: {
    position: 'relative',
    zIndex: 10,
  },

  // Curved Notch Navigation (wide shallow arc)
  navNotchContainer: {
    alignItems: 'center',
    marginTop: -1,
  },
  navNotchCurve: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '75%',
    paddingBottom: 6,
    height: 32,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    gap: 12,
  },
  navNotchButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonCancel: {},
  modalButtonSave: {},

  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  daySelectorButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  daySelectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  recurrenceDurationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recurrenceDurationOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceDurationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  weeksInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeksButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeksInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  formInputText: {
    flex: 1,
    fontSize: 16,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    flex: 1,
    minWidth: 100,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  counterText: {
    fontSize: 20,
    fontWeight: '700',
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeError: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },

  // Sliding Container & Views
  slidingContainer: {
    flex: 1,
    overflow: 'hidden',
    marginTop: 12,
  },
  slidingView: {
    flex: 1,
    width: '100%',
  },
  slidingViewAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Add Activity View
  addActivityView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  newActivityButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 16,
  },
  newActivityButtonTopText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mobileActionButtons: {
    gap: 12,
    marginBottom: 8,
  },
  importCalendarButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  importCalendarButtonMobileText: {
    fontSize: 15,
    fontWeight: '600',
  },
  importMessageMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  importMessageMobileText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  activitiesListScroll: {
    flex: 1,
  },
  activitiesListContent: {
    paddingBottom: 20,
  },
  emptyActivitiesList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyActivitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActivitiesSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  activityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityListColorBar: {
    width: 4,
    height: '100%',
    minHeight: 60,
  },
  activityListInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  activityListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityListDay: {
    fontSize: 13,
    fontWeight: '500',
  },
  activityListTime: {
    fontSize: 12,
  },
  activityListRecurring: {
    marginLeft: 4,
  },
  addActivityContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  addActivityIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addActivityTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addActivitySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
  },
  addActivityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Mobile List View
  mobileList: {
    flex: 1,
  },
  mobileListContent: {
    padding: 16,
    gap: 12,
  },
  mobileListContentSmooth: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  mobileListFull: {
    flex: 1,
  },
  dayRowFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dayRowTimeline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  dayLabelSection: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  timelineBar: {
    flex: 1,
    height: '70%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineActivityPositioned: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  timelineActivity: {
    flex: 1,
    maxWidth: 20,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  chevronSection: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayRowSmooth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dayRowFirst: {
    // Full width, no rounding
  },
  dayRowLast: {
    // Full width, no rounding
  },
  dayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconContainerSmooth: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayRowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayRowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  dayRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activityCountSmooth: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activityCountText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Mobile Expanded View
  expandedContent: {
    flex: 1,
  },
  expandedContentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  expandedDayColumn: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  expandedDayHeader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  expandedDayName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expandedActivitiesArea: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  emptyDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
  },
  // Expanded day activity items
  dayActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  dayActivityColorBar: {
    width: 5,
    height: '100%',
    minHeight: 70,
  },
  dayActivityInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dayActivityName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayActivityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayActivityTime: {
    fontSize: 14,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Desktop Grid - Time Grid Layout
  desktopGridWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dayColumnsWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  desktopDayColumnFull: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  desktopDayHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  desktopGridScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  desktopGridRow: {
    flexDirection: 'row',
  },
  timeGutter: {
    paddingTop: 8,
  },
  timeGutterSlot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeGutterLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -7,
  },
  desktopDayColumnGrid: {
    // No border radius - connects to header above
    position: 'relative',
    paddingTop: 8,
  },
  desktopHourCell: {
    position: 'relative',
  },
  desktopActivityBlock: {
    position: 'absolute',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopActivityBlockName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  desktopActivitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  desktopActivityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  desktopActivityChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Legacy styles (keeping for backwards compatibility)
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  dayColumn: {
    minHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayContent: {
    flex: 1,
  },
  timeSlotCell: {
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  timeSlotLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  emptyDaySmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  weekNavContainerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  weekNavButtonModal: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  weekNavTextModal: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 120,
    textAlign: 'center',
  },
});
