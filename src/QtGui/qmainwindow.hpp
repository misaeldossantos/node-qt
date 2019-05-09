#ifndef QMAINWINDOWWRAP_H
#define QMAINWINDOWWRAP_H
#include <QMainWindow>
#include <napi.h>
#include "qwidget.hpp"

//
// QMainWindowImpl()
// Extends QWidget to implement virtual methods from QWidget
//
class QMainWindowImpl : public QMainWindow
{
public:
  QMainWindowImpl(QWidget *parent, Napi::Env env);
  Napi::Value paintEventCallback_;
  Napi::Value mousePressCallback_;
  Napi::Value mouseReleaseCallback_;
  Napi::Value mouseMoveCallback_;
  Napi::Value keyPressCallback_;
  Napi::Value keyReleaseCallback_;
  Napi::FunctionReference resizeCallback_;

  Napi::Env env;

private:
  void paintEvent(QPaintEvent *e);
  void mousePressEvent(QMouseEvent *e);
  void mouseReleaseEvent(QMouseEvent *e);
  void mouseMoveEvent(QMouseEvent *e);
  void keyPressEvent(QKeyEvent *e);
  void keyReleaseEvent(QKeyEvent *e);
  void resizeEvent(QResizeEvent *e);
};

#include "../utils/unwrapper.hpp"
class QMainWindowWrap : public Napi::ObjectWrap<QMainWindowWrap>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  QMainWindowWrap(const Napi::CallbackInfo &info);
  ~QMainWindowWrap();

  QMainWindowImpl *q_;

private:
  static Napi::FunctionReference constructor;

  // QWidget Funcs
  QWIDGET_DEFS
};
#endif